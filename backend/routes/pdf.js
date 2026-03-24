const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

async function extractTextFromPdf(buffer) {
  // Extract raw text from PDF buffer by reading the stream directly
  const str = buffer.toString("binary");
  const textBlocks = [];

  // Extract text between BT and ET markers (PDF text blocks)
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(str)) !== null) {
    const block = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(((?:[^()\\]|\\[\s\S])*)\)\s*Tj/g;
    const tjArrRegex = /\[((?:[^\[\]]|\[(?:[^\[\]])*\])*)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const text = tjMatch[1]
        .replace(/\\n/g, " ")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/[^\x20-\x7E]/g, " ");
      if (text.trim()) textBlocks.push(text.trim());
    }
    while ((tjMatch = tjArrRegex.exec(block)) !== null) {
      const arrContent = tjMatch[1];
      const strRegex = /\(((?:[^()\\]|\\[\s\S])*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(arrContent)) !== null) {
        const text = strMatch[1]
          .replace(/\\n/g, " ")
          .replace(/\\r/g, " ")
          .replace(/[^\x20-\x7E]/g, " ");
        if (text.trim()) textBlocks.push(text.trim());
      }
    }
  }

  // Count pages
  const pageMatches = str.match(/\/Type\s*\/Page[^s]/g);
  const numPages = pageMatches ? pageMatches.length : 1;

  const fullText = textBlocks.join(" ").replace(/\s+/g, " ").trim();
  return { text: fullText, numpages: numPages };
}

router.post("/", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }
  try {
    const { text, numpages } = await extractTextFromPdf(req.file.buffer);
    const cleaned = text.slice(0, 10000);

    if (!cleaned || cleaned.length < 30) {
      return res.status(400).json({
        error: "Could not extract text from this PDF. It may be scanned or image-based. Please try a text-based PDF.",
      });
    }

    res.json({
      text: cleaned,
      pages: numpages,
      filename: req.file.originalname,
      characters: cleaned.length,
    });
  } catch (err) {
    console.error("PDF error:", err.message);
    res.status(500).json({ error: "Failed to parse PDF: " + err.message });
  }
});

module.exports = router;
