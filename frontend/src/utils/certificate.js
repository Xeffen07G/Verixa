import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * VeriXa Premium Certificate Generator v3.4 (ULTRA COMPATIBILITY)
 * - Standardized both "Export PDF" and "Certificate" buttons to use this logic.
 * - Forces the .pdf extension using a robust virtual link approach.
 */
export async function generateCertificate(claims, overallScore, text) {
  const filename = `VeriXa_Report_${Math.floor(Math.random() * 10000)}.pdf`;
  
  // 1. Setup Data
  const timestamp = new Date().toLocaleDateString();
  const label = overallScore >= 90 ? 'HIGHLY ACCURATE' 
              : overallScore >= 70 ? 'MOSTLY ACCURATE' 
              : overallScore >= 40 ? 'MIXED ACCURACY' : 'LOW ACCURACY';
  const scoreColor = overallScore >= 70 ? '#4ade80' : overallScore >= 40 ? '#fbbf24' : '#f87171';

  // 2. Create the rendering container (pixel-perfect)
  const certContainer = document.createElement('div');
  certContainer.style.cssText = `
    width: 900px; height: 630px; 
    background: #0a0a0f; color: #f5f3ef; 
    font-family: 'Segoe UI', system-ui, sans-serif; 
    padding: 40px; box-sizing: border-box; 
    position: fixed; left: -9999px; top: -9999px;
    display: flex; flex-direction: column;
    justify-content: space-between;
    border: 2px solid #c9a96e;
    z-index: -100;
  `;
  
  certContainer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(201,169,110,0.3); padding-bottom:15px;">
      <span style="font-size:20px; font-weight:700; color:#c9a96e;">VeriXa</span>
      <span style="font-size:10px; color:rgba(245,243,239,0.5);">FACT-CHECK REPORT</span>
    </div>

    <div style="text-align:center; padding:20px 0;">
      <h1 style="font-size:42px; margin:0 0 10px; color:#ffffff;">Verification Certificate</h1>
      <div style="font-size:56px; font-weight:900; color:${scoreColor}; margin-bottom:10px;">${overallScore}%</div>
      <h2 style="font-size:24px; color:${scoreColor}; margin:0 0 25px;">${label}</h2>
      
      <div style="background:rgba(255,255,255,0.04); padding:20px; border-radius:12px; text-align:left; font-size:14px; color:rgba(245,243,239,0.8); border:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0 0 8px; color:#c9a96e; font-weight:bold; text-transform:uppercase; font-size:11px;">CONTENT SUMMARY</p>
        <p style="margin:0; font-style:italic; line-height:1.6;">"${text.slice(0, 280)}${text.length > 280 ? '...' : ''}"</p>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; color:rgba(245,243,239,0.4); padding-top:20px; border-top:1px solid rgba(255,255,255,0.05);">
      <div>Generated on: ${timestamp}</div>
      <div style="text-align:right; color:#c9a96e;">verixa.ai</div>
    </div>
  `;

  document.body.appendChild(certContainer);

  try {
    const canvas = await html2canvas(certContainer, {
      backgroundColor: '#0a0a0f',
      scale: 2,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('l', 'px', [900, 630]);
    pdf.addImage(imgData, 'JPEG', 0, 0, 900, 630);
    
    // THE MOST ROBUST DOWNLOAD TRIGGER
    const pdfBlob = pdf.output('blob');
    const url = window.URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Small delay to ensure browser registers the blob
    setTimeout(() => {
      link.click();
      // Keep it in DOM for a moment longer
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 1000);
    }, 100);

  } catch (err) {
    console.error('PDF Generation failed:', err);
    // Ultimate Fallback: Just open the image in a new tab if PDF fails
    const canvas = await html2canvas(certContainer);
    const img = canvas.toDataURL('image/png');
    const win = window.open();
    win.document.write(`<img src="${img}" style="width:100%" />`);
  } finally {
    document.body.removeChild(certContainer);
  }
}
