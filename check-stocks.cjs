const Database = require('better-sqlite3');
const db = new Database('dev.db');

const stocks = db.prepare('SELECT ticker, market_cap_category FROM stock_recommendations ORDER BY ticker').all();
console.log(`\nTotal stock recommendations: ${stocks.length}\n`);

const large = stocks.filter(s => s.market_cap_category === 'large');
const mid = stocks.filter(s => s.market_cap_category === 'mid');
const small = stocks.filter(s => s.market_cap_category === 'small');

console.log(`Large Cap (${large.length}):`);
large.forEach(s => console.log(`  ${s.ticker}`));

console.log(`\nMid Cap (${mid.length}):`);
mid.forEach(s => console.log(`  ${s.ticker}`));

console.log(`\nSmall Cap (${small.length}):`);
small.forEach(s => console.log(`  ${s.ticker}`));

db.close();
