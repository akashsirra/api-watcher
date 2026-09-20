import { config } from "./config.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));

function matches(job) {
  const text = `${job.title} ${job.location}`.toLowerCase();
  const keyword = config.keywords.some(k => text.includes(k.toLowerCase()));
  const location = config.locations.some(l => text.includes(l.toLowerCase()));
  return keyword && location;
}

async function fetchPage(company) {
  const res = await fetch(company.url, {
    headers: { "user-agent": "IndiaJobChangeTracker/0.1 (+https://github.com/akashsirra/api-watcher)" }
  });
  if (!res.ok) throw new Error(`${company.name}: HTTP ${res.status}`);
  return res.text();
}

async function main() {
  console.log("India Job Change Tracker — prototype");
  console.log("Target:", config.keywords.join(", "));
  console.log("Locations:", config.locations.join(", "));
  console.log("");

  for (const company of config.companies) {
    try {
      const html = await fetchPage(company);
      console.log(`✓ ${company.name}: fetched ${html.length} bytes`);
      // Provider-specific parsers will be added after the demand test.
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
    await sleep(300);
  }

  console.log("\nNext provider adapter: ATS JSON endpoints (Greenhouse/Lever/Ashby/Workday).");
  console.log("This intentionally does not scrape LinkedIn/Indeed or bypass access controls.");
}

main().catch(err => { console.error(err); process.exit(1); });
