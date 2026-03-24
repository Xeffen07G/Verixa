const express = require("express");
const router = express.Router();
const multer = require("multer");
const PDFParser = require("pdf2json");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

function parsePdfBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", (err) => reject(new Error(err.parserError)));
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const pages = pdfData.Pages || [];
        let fullText = "";
        pages.forEach((page) => {
          const pageText = (page.Texts || [])
            .map((t) => decodeURIComponent(t.R.map((r) => r.T).join(" ")))
            .join(" ");
          fullText += pageText + "\n";
        });
        resolve({ text: fullText.trim(), numpages: pages.length });
      } catch (e) {
        reject(e);
      }
    });
    pdfParser.parseBuffer(buffer);
  });
}

router.post("/", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }
  try {
    const { text, numpages } = await parsePdfBuffer(req.file.buffer);
    const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 10000);
    if (!cleaned || cleaned.length < 30) {
      return res.status(400).json({ error: "Could not extract text from this PDF. It may be scanned or image-based." });
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