const supabase = require("../config/supabase");
const multer = require("multer");
const crypto = require("crypto");

// Configure multer to store files in memory temporarily
const storage = multer.memoryStorage();
exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return callback(null, true);
    callback(new Error("Only JPEG, PNG, and WebP images are allowed"));
  },
}).single("image");

exports.uploadProductImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const file = req.file;
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.mimetype];
  const uniqueFilename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(uniqueFilename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) return res.status(500).json({ error: error.message });

  const { data: publicUrlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(uniqueFilename);

  res.status(201).json({
    message: "Image uploaded successfully!",
    imageUrl: publicUrlData.publicUrl,
  });
};
