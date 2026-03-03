const Database = require('better-sqlite3');
const db = new Database('dev.db');

const logs = db.prepare('SELECT * FROM refresh_logs ORDER BY executed_at DESC LIMIT 10').all();
logs.forEach(l => {
  const time = new Date(l.executed_at * 1000).toLocaleTimeString();
  console.log(`[${time}] ${l.status.toUpperCase()}: ${l.message}`);
});

db.close();
