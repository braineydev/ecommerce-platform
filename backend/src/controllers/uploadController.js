const supabase = require("../config/supabase");
const multer = require("multer");
const crypto = require("crypto");
const sharp = require("sharp");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 2048;
const PRODUCT_IMAGE_BUCKET = "product-images";

const ensurePublicProductImageBucket = async () => {
  const { data: bucket, error: getBucketError } = await supabase.storage
    .getBucket(PRODUCT_IMAGE_BUCKET);

  if (getBucketError && !/not found/i.test(getBucketError.message || "")) {
    throw getBucketError;
  }

  if (!bucket) {
    const { error } = await supabase.storage.createBucket(PRODUCT_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    });
    if (error) throw error;
    return;
  }

  if (!bucket.public) {
    const { error } = await supabase.storage.updateBucket(
      PRODUCT_IMAGE_BUCKET,
      { public: true },
    );
    if (error) throw error;
  }
};

const imageSignatures = {
  "image/jpeg": buffer =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  "image/png": buffer =>
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": buffer =>
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP",
  "image/avif": buffer =>
    buffer.length >= 16 &&
    buffer.subarray(4, 8).toString() === "ftyp" &&
    ["avif", "avis"].includes(buffer.subarray(8, 12).toString()),
};

const validateImageSignature = file =>
  imageSignatures[file.mimetype]?.(file.buffer) === true;

// Configure multer to store files in memory temporarily
const storage = multer.memoryStorage();
exports.upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    if (
      ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.mimetype,
      )
    )
      return callback(null, true);
    callback(new Error("Only JPEG, PNG, WebP, and AVIF images are allowed"));
  },
}).single("image");

exports.uploadProductImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const file = req.file;
  if (!validateImageSignature(file)) {
    return res
      .status(400)
      .json({ error: "The uploaded file is not a valid image" });
  }

  try {
    await ensurePublicProductImageBucket();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  let optimizedImageBuffer;
  try {
    const metadata = await sharp(file.buffer, {
      limitInputPixels: MAX_DIMENSION * MAX_DIMENSION,
    }).metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_DIMENSION ||
      metadata.height > MAX_DIMENSION
    ) {
      return res
        .status(400)
        .json({
          error: `Image dimensions must not exceed ${MAX_DIMENSION}x${MAX_DIMENSION}px`,
        });
    }
    optimizedImageBuffer = await sharp(file.buffer, {
      limitInputPixels: MAX_DIMENSION * MAX_DIMENSION,
    })
      .rotate()
      .webp({ quality: 88, effort: 4 })
      .toBuffer();
  } catch {
    return res
      .status(400)
      .json({ error: "The uploaded file is not a supported, valid image" });
  }

  const optimizedImage = optimizedImageBuffer.buffer.slice(
    optimizedImageBuffer.byteOffset,
    optimizedImageBuffer.byteOffset + optimizedImageBuffer.byteLength,
  );

  const uniqueFilename = `${Date.now()}-${crypto.randomUUID()}.webp`;

  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(uniqueFilename, optimizedImage, {
      contentType: "image/webp",
      upsert: false,
    });

  if (error) return res.status(500).json({ error: error.message });

  const { data: publicUrlData } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(uniqueFilename);

  res.status(201).json({
    message: "Image uploaded successfully!",
    imageUrl: publicUrlData.publicUrl,
  });
};
