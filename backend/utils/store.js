const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../data');
if (!fs.existsSync(STORE_PATH)) fs.mkdirSync(STORE_PATH);

const USERS_FILE = path.join(STORE_PATH, 'users.json');
const VERIFICATIONS_FILE = path.join(STORE_PATH, 'verifications.json');

const loadData = (file) => {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
};

const saveData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const createModel = (file) => ({
  find: function(query = {}) {
    let data = loadData(file);
    let results = data.filter(u => {
      return Object.entries(query).every(([k, v]) => {
        if (v && v.$regex) return new RegExp(v.$regex, v.$options || 'i').test(u[k]);
        if (v instanceof RegExp) return v.test(u[k]);
        return u[k] === v;
      });
    });

    // Mock Mongoose chaining
    const chain = {
      sort: function(sortOpts) {
        const [field, order] = Object.entries(sortOpts)[0];
        results.sort((a, b) => {
          if (a[field] < b[field]) return order === -1 ? 1 : -1;
          if (a[field] > b[field]) return order === -1 ? -1 : 1;
          return 0;
        });
        return this;
      },
      limit: function(n) {
        results = results.slice(0, n);
        return this;
      },
      select: function() { return this; }, // No-op for mock
      then: function(resolve) { resolve(results); },
      catch: function(reject) { /* No errors in mock */ }
    };

    // Return proxy or just make it an awaitable
    results.sort = chain.sort.bind(chain);
    results.limit = chain.limit.bind(chain);
    results.select = chain.select.bind(chain);
    
    // Support await
    const originalResults = [...results];
    Object.assign(results, chain);
    
    return results;
  },
  findOne: async (query) => {
    const data = loadData(file);
    return data.find(u => {
      return Object.entries(query).every(([k, v]) => u[k] === v);
    });
  },
  create: async (data) => {
    const items = loadData(file);
    const newItem = { ...data, _id: Date.now().toString(), createdAt: new Date().toISOString(), timestamp: new Date().toISOString() };
    if (file.includes('users')) {
      newItem.matchPassword = async (pass) => pass === data.password;
    }
    items.push(newItem);
    saveData(file, items);
    return newItem;
  }
});

module.exports = {
  User: createModel(USERS_FILE),
  Verification: createModel(VERIFICATIONS_FILE)
};
