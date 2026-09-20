import { fetchProvider } from "./providers/greenhouse.js";
import { filterJobs, normalizeJob } from "./pipeline.js";
import { saveJobs } from "./store.js";

const companies = [
  { name: "airbnb", provider: "greenhouse", board: "airbnb" },
  { name: "stripe", provider: "greenhouse", board: "stripe" },
  { name: "figma", provider: "greenhouse", board: "figma" }
];

const args = process.argv.slice(2);

function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

const companyArg = getArg("--company");
const levelArg = getArg("--level");
const locationArg = getArg("--location");
const jsonMode = args.includes("--json");

const selected = companyArg
  ? companies.filter(c =>
      c.name.toLowerCase() === companyArg.toLowerCase()
    )
  : companies;

const displayJobs = [];
const stateJobs = [];
const successfulSources = [];
const sourceResults = [];

for (const company of selected) {
  try {
    const jobs = await fetchProvider(
      company.provider,
      company.board
    );

    successfulSources.push(company.name);

    stateJobs.push(...jobs.map(normalizeJob));

    const matches = filterJobs(jobs, {
      level: levelArg,
      location: locationArg
    });

    displayJobs.push(...matches);

    sourceResults.push({
      company: company.name,
      status: "OK",
      total_jobs: jobs.length,
      matched_jobs: matches.length
    });

    if (!jsonMode) {
      console.log(
        `${company.name}: ${jobs.length} total → ${matches.length} India software jobs`
      );

      for (const job of matches) {
        console.log(
          `  [${job.experience_level}] ${job.title} — ${job.location}`
        );
      }
    }
  } catch (error) {
    sourceResults.push({
      company: company.name,
      status: "SOURCE_ERROR",
      error: error.message
    });

    if (!jsonMode) {
      console.log(
        `${company.name}: SOURCE_ERROR - ${error.message}`
      );
    }
  }
}

const allChanges = saveJobs(
  stateJobs,
  successfulSources
);

const displayIds = new Set(
  displayJobs.map(job => String(job.id))
);

const changes = allChanges.filter(
  job => displayIds.has(String(job.id))
);

if (jsonMode) {
  console.log(JSON.stringify({
    generated_at: new Date().toISOString(),
    source_results: sourceResults,
    jobs: displayJobs,
    changes
  }, null, 2));
} else {
  console.log(`\nTotal India software jobs: ${displayJobs.length}`);
  console.log(`Changes: ${changes.length}\n`);

  for (const job of changes) {
    console.log(
      `[${job.status}] ${job.company} — ${job.title}`
    );
  }
}
