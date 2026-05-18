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
      return JSON.parse(JSON.stringify(defaultStore)); // Deep copy
    }
    const data = fs.readFileSync(STORE_PATH, 'utf-8');
    if (!data || !data.trim()) {
       return JSON.parse(JSON.stringify(defaultStore));
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("[STORE] Read failed, returning default:", err);
    return JSON.parse(JSON.stringify(defaultStore));
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

// In-memory User Mock for SAFE_MODE
const User = {
  async findOne({ email }) {
    const store = readStore();
    return (store.users || []).find(u => u.email === email);
  },
  async create(userData) {
    const store = readStore();
    if (!store.users) store.users = [];
    const newUser = { 
      ...userData, 
      _id: `user_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    store.users.push(newUser);
    writeStore(store);
    return newUser;
  },
  async findById(id) {
    const store = readStore();
    return (store.users || []).find(u => u._id === id);
  }
};

module.exports = { readStore, writeStore, User };
