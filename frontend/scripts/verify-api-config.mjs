import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { API_BASE_URL, API_URL, getApiUrl } from '../src/config/api.ts';

const SRC_ROOT = path.resolve('src');
const CONFIG_API_FILE = path.join(SRC_ROOT, 'config', 'api.ts');

const FORBIDDEN_PATTERNS = [
  /fibersupplychain\.onrender\.com/i,
  /localhost:5000/i,
  /localhost:300[01]/i,
  /127\.0\.0\.1:5000/i,
  /import\.meta\.env\.VITE_API_URL/,
  /['"]\$\{API_(?:BASE_)?URL\}/,
];

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// 1. Validate centralized API config exports
assert.ok(API_BASE_URL.startsWith('http'), 'API_BASE_URL must start with http/https');
assert.ok(!API_BASE_URL.endsWith('/'), 'API_BASE_URL must not end with /');
assert.ok(!/\/api$/i.test(API_BASE_URL), 'API_BASE_URL must not end with /api');
assert.equal(API_URL, `${API_BASE_URL}/api`);
assert.equal(getApiUrl('/api/auth/me'), `${API_BASE_URL}/api/auth/me`);
assert.equal(getApiUrl('api/auth/me'), `${API_BASE_URL}/api/auth/me`);
assert.equal(getApiUrl('/uploads/test.png'), `${API_BASE_URL}/uploads/test.png`);
assert.equal(getApiUrl('https://example.com/custom'), 'https://example.com/custom');

// 2. Ensure zero hardcoded backend URLs or direct VITE_API_URL reads remain outside config/api.ts
const violations = [];
for (const file of walk(SRC_ROOT)) {
  if (path.resolve(file) === path.resolve(CONFIG_API_FILE)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        violations.push(`${path.relative(SRC_ROOT, file)}:${index + 1}: ${line.trim()}`);
      }
    }
  });
}

assert.equal(
  violations.length,
  0,
  `Found hardcoded API URLs outside src/config/api.ts:\n${violations.join('\n')}`
);

console.log('PASS: API URL centralization config and zero-hardcoded-URL checks succeeded.');
