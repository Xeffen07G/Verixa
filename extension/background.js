// VeriXa Chrome Extension — Background Service Worker
// Handles context menu, API calls, and message routing
//
// In Manifest V3, content scripts can't reliably make cross-origin requests.
// All API calls are routed through this background service worker instead.

// In production, change this to your deployed Render URL
const VERIXA_API = 'https://verixa-backend.onrender.com'; // Fallback to production URL if known, or use a placeholder

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'verixa-verify',
    title: 'Verify with VeriXa',
    contexts: ['selection'],
  });
  console.log('VeriXa extension installed — context menu created');
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'verixa-verify' && info.selectionText) {
    // Send selected text to content script to show overlay, then do API call here
    chrome.tabs.sendMessage(tab.id, {
      action: 'showOverlay',
      text: info.selectionText,
    });

    // Start verification via background (no CORS issues here)
    verifyText(info.selectionText, tab.id);
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getLastResult') {
    chrome.storage.local.get(['lastResult'], (data) => {
      sendResponse(data.lastResult || null);
    });
    return true; // async response
  }

  if (message.action === 'verify') {
    // Content script requested verification
    verifyText(message.text, sender.tab?.id);
    return false;
  }

  if (message.action === 'getHistory') {
    chrome.storage.local.get(['history'], (data) => {
      sendResponse(data.history || []);
    });
    return true;
  }
});

async function verifyText(text, tabId) {
  try {
    const response = await fetch(`${VERIXA_API}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, detectAI: false }),
    });

    if (!response.ok) {
      sendToTab(tabId, { action: 'verifyError', error: `Server responded with ${response.status}` });
      return;
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop();

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.event === 'stage') {
              sendToTab(tabId, { action: 'verifyStage', stage: data.stage });
            }
            if (data.event === 'result') {
              result = data;
            }
          } catch (e) { /* skip parse errors */ }
        }
      }
    }

    if (result) {
      sendToTab(tabId, { action: 'verifyResult', result });

      // Save to storage
      chrome.storage.local.set({ lastResult: { claims: result.claims, overallScore: result.overallScore } });
      chrome.storage.local.get(['history'], (data) => {
        const history = data.history || [];
        history.unshift({
          overallScore: result.overallScore,
          claimCount: result.claims?.length || 0,
          timestamp: new Date().toISOString(),
          text: text.slice(0, 200),
        });
        chrome.storage.local.set({ history: history.slice(0, 20) });
      });
    } else {
      sendToTab(tabId, { action: 'verifyError', error: 'No results received from server' });
    }
  } catch (err) {
    console.error('VeriXa verify error:', err);
    sendToTab(tabId, {
      action: 'verifyError',
      error: err.message || 'Could not connect to VeriXa backend',
    });
  }
}

function sendToTab(tabId, message) {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, message).catch(() => {});
  }
}
