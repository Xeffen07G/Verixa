const express = require("express");
const router = express.Router();
const multer = require("multer");
const { PdfReader } = require("pdfreader");
const Groq = require("groq-sdk");

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
    const rows = {};
    let currentPage = 0;

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(new Error(err.message || "PDF parse error"));
        return;
      }

      if (!item) {
        // End of file — assemble text
        const text = Object.keys(rows)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => rows[k].join(" "))
          .join("\n");
        resolve({ text, numpages: currentPage });
        return;
      }

      if (item.page) {
        currentPage = item.page;
        rows[currentPage] = rows[currentPage] || [];
      }

      if (item.text) {
        if (!rows[currentPage]) rows[currentPage] = [];
        rows[currentPage].push(item.text);
      }
    });
  });
}

router.post("/", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }
  try {
    const { text, numpages } = await parsePdfBuffer(req.file.buffer);
    const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 10000);
    if (!cleaned || cleaned.length < 5) {
      return res.status(400).json({
        error: "Could not extract text from this PDF. Please use a text-based PDF, not a scanned image.",
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

router.post("/ocr", async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Image data required" });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an expert OCR engine. Extract EVERY word and sentence from this document image. Return ONLY the raw text found. Do not add any commentary or labels.",
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    const text = completion.choices[0].message.content.trim();
    res.json({ text });
  } catch (err) {
    console.error("Deep Scan OCR error:", err.message);
    res.status(500).json({ error: "Deep Scan failed: " + err.message });
  }
});

module.exports = router;