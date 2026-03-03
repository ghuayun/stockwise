import { ipoService } from "./server/services/ipoService";
import { storage } from "./server/storage";

async function testIPO() {
  console.log("Testing IPO service...");
  
  const ipos = await ipoService.fetchUpcomingIPOs();
  console.log(`Fetched ${ipos.length} IPOs:`);
  console.log(JSON.stringify(ipos, null, 2));
  
  console.log("\nClearing existing IPOs...");
  await storage.deleteAllUpcomingIPOs();
  
  console.log("Inserting new IPOs...");
  for (const ipo of ipos) {
    await storage.createUpcomingIPO(ipo);
  }
  
  console.log("\nFetching from database...");
  const dbIPOs = await storage.getAllUpcomingIPOs();
  console.log(`Found ${dbIPOs.length} IPOs in database`);
  console.log(JSON.stringify(dbIPOs, null, 2));
}

testIPO().then(() => {
  console.log("Done!");
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
