/**
 * PDF Text Extraction Utility
 * 
 * Uses pdfjs-dist (modern Mozilla pdf.js) for reliable PDF text extraction.
 * Replaces the legacy pdf-parse library which used pdf.js 1.10.100 and had
 * intermittent "bad XRef entry" failures on valid PDFs.
 */

const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

/**
 * Extract text from a PDF buffer.
 * Returns an object compatible with the pdf-parse interface:
 *   { text: string, numpages: number }
 * 
 * @param {Buffer} dataBuffer - The raw PDF file bytes
 * @returns {Promise<{text: string, numpages: number}>}
 */
async function extractPdfText(dataBuffer) {
  // Convert Node Buffer to Uint8Array for pdfjs-dist
  const uint8Array = new Uint8Array(dataBuffer);
  
  const doc = await pdfjsLib.getDocument({
    data: uint8Array,
    // Disable font loading warnings in Node.js (no DOM available)
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;
  
  const numPages = doc.numPages;
  let fullText = "";
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    
    // Reconstruct text with proper spacing
    const pageText = content.items
      .map(item => item.str)
      .join(" ");
    
    fullText += (pageNum > 1 ? "\n\n" : "") + pageText;
  }
  
  return {
    text: fullText,
    numpages: numPages
  };
}

module.exports = extractPdfText;
