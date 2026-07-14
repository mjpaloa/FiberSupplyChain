const fs = require('fs').promises;
const path = require('path');
const root = path.resolve(__dirname, '..', 'frontend');
const oldHost = 'https://server.easyabaca.site';
const newHost = 'https://fibersupplychain.onrender.com';
const exts = ['.ts', '.tsx', '.js', '.jsx', '.env'];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else if (exts.includes(path.extname(entry.name))) {
      let content = await fs.readFile(full, 'utf8');
      if (content.includes(oldHost)) {
        const newContent = content.split(oldHost).join(newHost);
        await fs.writeFile(full, newContent, 'utf8');
        console.log('Replaced in:', full);
      }
    }
  }
}

walk(root).catch(err => { console.error(err); process.exit(1); });
