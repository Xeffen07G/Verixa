const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

router.post("/", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }
  try {
    const data = await pdfParse(req.file.buffer);
    const text = data.text.replace(/\s+/g, " ").trim().slice(0, 10000);
    if (!text || text.length < 30) {
      return res.status(400).json({ error: "Could not extract text from PDF." });
    }
    res.json({
      text,
      pages: data.numpages,
      filename: req.file.originalname,
      characters: text.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to parse PDF: " + err.message });
  }
});

module.exports = router;