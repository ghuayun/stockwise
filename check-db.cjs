const Database = require('better-sqlite3');
const db = new Database('dev.db');

console.log('\n=== Database Tables ===\n');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

tables.forEach(t => {
  const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get();
  console.log(`${t.name}: ${count.cnt} rows`);
});

console.log('\n=== Stock Recommendations ===\n');
const recs = db.prepare('SELECT * FROM stock_recommendations LIMIT 5').all();
console.log(JSON.stringify(recs, null, 2));

db.close();
