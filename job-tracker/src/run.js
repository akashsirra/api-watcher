import { fetchProvider } from "./providers/greenhouse.js";
import { filterJobs, normalizeJob } from "./pipeline.js";
import { saveJobs } from "./store.js";
import { candidate } from "./matching/candidate.js";
import { matchJobs } from "./matching/decision.js";

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
const matchMode = args.includes("--match");

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

let matchedJobs = displayJobs;

if (matchMode) {
  matchedJobs = await matchJobs(displayJobs, candidate);
}

const allChanges = saveJobs(
  stateJobs,
  successfulSources
);

const displayIds = new Set(
  matchedJobs.map(job => String(job.id))
);

const changes = allChanges.filter(
  job => displayIds.has(String(job.id))
);

if (jsonMode) {
  console.log(JSON.stringify({
    generated_at: new Date().toISOString(),
    source_results: sourceResults,
    jobs: matchedJobs,
    changes
  }, null, 2));
} else {
  console.log(`\nTotal India software jobs: ${matchedJobs.length}`);
  console.log(`Changes: ${changes.length}`);

  for (const job of changes) {
    console.log(
      `[${job.status}] ${job.company} — ${job.title}`
    );
  }

  if (matchMode) {
    console.log("\nJev match decisions:");
    for (const job of matchedJobs) {
      const match = job.match;
      if (match?.error) {
        console.log(`  [REVIEW] ${job.company} — ${job.title} — ${match.error}`);
        continue;
      }
      const score = match.skill_fit == null ? "?" : match.skill_fit.toFixed(2);
      const role = match.role_fit == null ? "?" : match.role_fit.toFixed(2);
      console.log(`  [${match.action}] ${job.company} — ${job.title} | skill ${score}/4 | role ${role}`);
    }
  }
}
