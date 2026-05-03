// VeriXa Chrome Extension — Content Script
// Handles UI overlay only. All API calls go through background.js.

let _lastVerifiedText = '';

// --- Auto-inject: If we're on localhost:3000/verify?source=extension, pull text from chrome.storage ---
(function autoInjectForVerifyPage() {
  if (window.location.origin.includes('verixa') && window.location.pathname === '/verify') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') === 'extension') {
      chrome.storage.local.get(['extensionText'], (data) => {
        if (data.extensionText) {
          // Write to sessionStorage so the React app can read it
          sessionStorage.setItem('verixa-extension-text', data.extensionText);
          // Clean up
          chrome.storage.local.remove('extensionText');
          // Dispatch event to notify React app
          window.dispatchEvent(new CustomEvent('verixa-extension-ready'));
        }
      });
    }
  }
})();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showOverlay') {
    _lastVerifiedText = message.text;
    showOverlay(message.text);
  }

  if (message.action === 'verify') {
    _lastVerifiedText = message.text;
    showOverlay(message.text);
    chrome.runtime.sendMessage({ action: 'verify', text: message.text });
  }

  if (message.action === 'verifyStage') {
    updateStage(message.stage);
  }

  if (message.action === 'verifyResult') {
    showResults(message.result);
  }

  if (message.action === 'verifyError') {
    showError(message.error);
  }
});

function showOverlay(text) {
  const existing = document.getElementById('verixa-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'verixa-overlay';
  overlay.innerHTML = `
    <div class="verixa-panel">
      <div class="verixa-header">
        <div class="verixa-logo">
          <span class="verixa-logo-icon">V</span>
          <span class="verixa-logo-text">VeriXa</span>
        </div>
        <button class="verixa-close" id="verixa-close">✕</button>
      </div>
      <div class="verixa-body" id="verixa-body">
        <div class="verixa-input-preview">
          <p class="verixa-preview-label">VERIFYING</p>
          <p class="verixa-preview-text">"${text.length > 120 ? text.slice(0, 120) + '...' : text}"</p>
        </div>
        <div class="verixa-loading">
          <div class="verixa-spinner"></div>
          <p class="verixa-loading-text" id="verixa-stage-text">Connecting to VeriXa...</p>
          <p class="verixa-loading-sub">Extracting claims and searching evidence</p>
          <div class="verixa-stage-pills" id="verixa-stage-pills">
            <span class="verixa-pill verixa-pill-active" id="verixa-pill-extract">Extracting</span>
            <span class="verixa-pill" id="verixa-pill-search">Searching</span>
            <span class="verixa-pill" id="verixa-pill-verify">Verifying</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('verixa-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function updateStage(stage) {
  const stageText = document.getElementById('verixa-stage-text');
  const pills = {
    extracting: document.getElementById('verixa-pill-extract'),
    searching: document.getElementById('verixa-pill-search'),
    verifying: document.getElementById('verixa-pill-verify'),
  };

  const labels = {
    extracting: 'Extracting claims...',
    searching: 'Searching evidence...',
    verifying: 'Verifying claims...',
  };

  if (stageText) stageText.textContent = labels[stage] || 'Processing...';

  const stageOrder = ['extracting', 'searching', 'verifying'];
  const currentIdx = stageOrder.indexOf(stage);

  for (let i = 0; i < stageOrder.length; i++) {
    const pill = pills[stageOrder[i]];
    if (!pill) continue;
    pill.className = 'verixa-pill';
    if (i < currentIdx) pill.classList.add('verixa-pill-done');
    if (i === currentIdx) pill.classList.add('verixa-pill-active');
  }
}

function showResults(data) {
  const body = document.getElementById('verixa-body');
  if (!body) return;

  const score = data.overallScore;
  const scoreColor = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171';
  const label = score >= 70 ? 'Mostly Accurate' : score >= 40 ? 'Mixed Accuracy' : 'Mostly Inaccurate';

  const verdictColors = {
    'True': { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', icon: '✓' },
    'False': { color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: '✕' },
    'Partially True': { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', icon: '~' },
    'Unverifiable': { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', icon: '?' },
  };

  body.innerHTML = `
    <div class="verixa-score" style="text-align:center;margin-bottom:16px;">
      <div style="font-size:48px;font-weight:300;color:${scoreColor};line-height:1;">${score}%</div>
      <div style="font-size:12px;color:${scoreColor};margin-top:4px;font-weight:600;">${label}</div>
    </div>
    <div class="verixa-claims">
      ${(data.claims || []).map((c, i) => {
        const v = verdictColors[c.verdict] || verdictColors['Unverifiable'];
        return `
          <div class="verixa-claim" style="padding:12px;border-radius:10px;margin-bottom:8px;background:${v.bg};border:1px solid ${v.color}22;">
            <div style="display:flex;align-items:flex-start;gap:10px;">
              <span style="color:${v.color};font-weight:700;font-size:14px;flex-shrink:0;">${v.icon}</span>
              <div>
                <p style="margin:0 0 6px;font-size:13px;color:#f5f3ef;line-height:1.5;">${c.claim}</p>
                <span style="font-size:10px;padding:2px 8px;border-radius:999px;background:${v.bg};color:${v.color};font-weight:700;">${c.verdict}</span>
                <p style="margin:6px 0 0;font-size:11px;color:rgba(245,243,239,0.5);line-height:1.5;">${c.reasoning || ''}</p>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <button class="verixa-open-btn" id="verixa-open-report">Open Full Report →</button>
  `;

  const reportBtn = document.getElementById('verixa-open-report');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      // Store the text in chrome.storage so the verify page can read it
      chrome.storage.local.set({ extensionText: _lastVerifiedText }, () => {
        window.open('https://verixa-gamma.vercel.app/verify?source=extension', '_blank');
      });
    });
  }
}

function showError(message) {
  const body = document.getElementById('verixa-body');
  if (!body) return;
  body.innerHTML = `
    <div style="text-align:center;padding:24px 0;">
      <div style="font-size:32px;margin-bottom:12px;opacity:0.3;">⚠️</div>
      <p style="color:#f87171;font-size:13px;margin:0 0 8px;">${message}</p>
      <p style="color:rgba(245,243,239,0.35);font-size:11px;margin:0;">
        Make sure VeriXa backend is running:<br>
        <code style="color:#c9a96e;font-size:10px;">cd verixa && npm run dev</code>
      </p>
    </div>
  `;
}

