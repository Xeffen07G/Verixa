const { PdfReader } = require("pdfreader");

/**
 * Specialized parser for documents.
 * Extracts text, sections, and basic structure.
 */
async function parsePDF(buffer) {
  return new Promise((resolve, reject) => {
    const rows = {};
    let currentPage = 0;

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) return reject(new Error(err.message || "PDF parse error"));
      if (!item) {
        // End of file — assemble text with page markers
        const pages = Object.keys(rows)
          .sort((a, b) => Number(a) - Number(b))
          .map((p) => ({
            pageNumber: Number(p),
            content: rows[p].join(" "),
          }));
        resolve(pages);
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

/**
 * Semantic-aware chunking.
 * Splits text into meaningful chunks with overlap.
 */
function createChunks(pages, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  
  for (const page of pages) {
    const text = page.content;
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to find a natural break point (period, newline) within the last 100 chars of the chunk
      if (end < text.length) {
        const breakChars = [". ", "\n", "! ", "? "];
        let foundBreak = false;
        for (let i = end; i > end - 100; i--) {
          if (breakChars.some(c => text.substring(i, i + 2) === c)) {
            end = i + 1;
            foundBreak = true;
            break;
          }
        }
      }
      
      chunks.push({
        text: text.substring(start, end).trim(),
        metadata: {
          page: page.pageNumber,
          charStart: start,
          charEnd: end
        }
      });
      
      start = end - overlap;
      if (start < 0) start = 0;
      if (end >= text.length) break;
    }
  }
  
  return chunks;
}

module.exports = { parsePDF, createChunks };
