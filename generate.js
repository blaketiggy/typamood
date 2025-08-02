// Static site generator
const fs = require('fs');
const path = require('path');

// Mock generation logic
const moodboards = require('./mock-data.json');

moodboards.forEach(board => {
  const html = `<html><head><title>${board.slug}</title></head><body><h1>${board.slug}</h1></body></html>`;
  const outDir = path.join('dist', board.username, board.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
});
