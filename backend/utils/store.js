const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../intelligence_store.json');

const defaultStore = {
  boards: [],
  sessions: {},
  papers: [],
  verifications: [],
  benchmarks: {
    hallucinationRate: 0,
    citationAccuracy: 0,
    totalEvaluations: 0
  }
};

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStore, null, 2));
      return defaultStore;
    }
    const data = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("[STORE] Read failed, returning default:", err);
    return defaultStore;
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("[STORE] Write failed:", err);
    return false;
  }
}

module.exports = { readStore, writeStore };
