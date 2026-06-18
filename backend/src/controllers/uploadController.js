const supabase = require("../config/supabase");
const multer = require("multer");

// Configure multer to store files in memory temporarily
const storage = multer.memoryStorage();
exports.upload = multer({ storage: storage }).single("image");

exports.uploadProductImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const file = req.file;
  const uniqueFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;

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
