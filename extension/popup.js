// VeriXa Chrome Extension — Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const body = document.getElementById('body');
  const historyBtn = document.getElementById('historyBtn');

  // Load last result
  chrome.runtime.sendMessage({ action: 'getLastResult' }, (result) => {
    if (result && result.overallScore !== undefined) {
      const score = result.overallScore;
      const lang = result.lang || 'en';
      const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171';
      
      const labels = {
        en: { high: 'Highly Accurate', mid: 'Mixed Accuracy', low: 'Mostly Inaccurate' },
        es: { high: 'Altamente preciso', mid: 'Precisión mixta', low: 'Mayormente inexacto' },
        bn: { high: 'অত্যন্ত নির্ভুল', mid: 'মিশ্র নির্ভুলতা', low: 'বেশিরভাগ ভুল' }
      };
      const l = labels[lang] || labels.en;
      const label = score >= 70 ? l.high : score >= 40 ? l.mid : l.low;

      const verdictColors = {
        'True': { color: '#4ade80', icon: '✓' },
        'False': { color: '#f87171', icon: '✕' },
        'Partially True': { color: '#fbbf24', icon: '~' },
        'Unverifiable': { color: '#9ca3af', icon: '?' },
      };

      body.innerHTML = `
        <div class="result-card">
          <div class="score" style="color:${color}">${score}%</div>
          <div class="label" style="color:${color}">${label}</div>
        </div>
        ${(result.claims || []).slice(0, 4).map(c => {
          const v = verdictColors[c.verdict] || verdictColors['Unverifiable'];
          return `
            <div class="claim-row">
              <span class="verdict-icon" style="color:${v.color}">${v.icon}</span>
              <span>${c.claim?.slice(0, 80)}${c.claim?.length > 80 ? '...' : ''}</span>
            </div>
          `;
        }).join('')}
      `;
    }
  });

  // History button
  historyBtn.addEventListener('click', () => {
    chrome.storage.local.get(['history'], (data) => {
      const history = data.history || [];
      if (history.length === 0) {
        const lang = (localStorage.getItem('verixa-lang') || 'en').split('-')[0];
        const msg = {
          en: 'No verification history yet.',
          es: 'Aún no hay historial de verificación.',
          bn: 'এখনও কোনো যাচাইকরণের ইতিহাস নেই।'
        };
        body.innerHTML = `<div class="status"><div class="status-icon">📋</div><p>${msg[lang] || msg.en}</p></div>`;
        return;
      }

      body.innerHTML = history.slice(0, 8).map((h, i) => {
        const color = h.overallScore >= 70 ? '#4ade80' : h.overallScore >= 40 ? '#fbbf24' : '#f87171';
        return `
          <div class="claim-row" style="border-bottom:1px solid rgba(255,255,255,0.04);">
            <span style="color:${color};font-weight:700;font-size:14px;min-width:36px;">${h.overallScore || '?'}%</span>
            <div>
              <span>${h.text?.slice(0, 60) || 'Verification'}${h.text?.length > 60 ? '...' : ''}</span>
              <div style="font-size:10px;color:rgba(245,243,239,0.25);margin-top:2px;">${new Date(h.timestamp).toLocaleDateString()}</div>
            </div>
          </div>
        `;
      }).join('');
    });
  });
});
