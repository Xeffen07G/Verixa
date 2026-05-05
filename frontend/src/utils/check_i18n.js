const fs = require('fs');
const path = 'c:/Users/sayak/Downloads/verixa/frontend/src/utils/i18n.js';
const content = fs.readFileSync(path, 'utf8');

// Simple extraction of objects
function extractObject(langCode) {
    const start = content.indexOf(`const ${langCode} = {`);
    if (start === -1) return null;
    const end = content.indexOf('};', start);
    const objStr = content.substring(start + `const ${langCode} = {`.length, end);
    const keys = [];
    const lines = objStr.split(',');
    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            if (key) keys.push(key);
        }
    });
    return keys;
}

const enKeys = extractObject('en');
const languages = ['es', 'bn', 'hi', 'fr', 'de', 'id', 'pt', 'it', 'ar', 'ru', 'ja', 'zh'];

const missing = {};
languages.forEach(lang => {
    const keys = extractObject(lang);
    if (keys) {
        const missingKeys = enKeys.filter(k => !keys.includes(k));
        if (missingKeys.length > 0) {
            missing[lang] = missingKeys;
        }
    } else {
        missing[lang] = 'OBJECT NOT FOUND';
    }
});

console.log(JSON.stringify(missing, null, 2));
