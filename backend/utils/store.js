const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../data');
if (!fs.existsSync(STORE_PATH)) fs.mkdirSync(STORE_PATH);

const USERS_FILE = path.join(STORE_PATH, 'users.json');

const loadUsers = () => {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

module.exports = {
  User: {
    find: async (query = {}) => {
      const users = loadUsers();
      return users.filter(u => {
        return Object.entries(query).every(([k, v]) => {
          if (v instanceof RegExp) return v.test(u[k]);
          return u[k] === v;
        });
      });
    },
    findOne: async (query) => {
      const users = loadUsers();
      return users.find(u => {
        return Object.entries(query).every(([k, v]) => u[k] === v);
      });
    },
    create: async (data) => {
      const users = loadUsers();
      const newUser = { ...data, _id: Date.now().toString(), createdAt: new Date().toISOString() };
      // Simulating bcrypt matchPassword method
      newUser.matchPassword = async (pass) => pass === data.password; // Simple for local testing
      users.push(newUser);
      saveUsers(users);
      return newUser;
    }
  }
};
