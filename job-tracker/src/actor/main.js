import { Actor } from "apify";
import { fetchProvider } from "../providers/greenhouse.js";
import { filterJobs, normalizeJob } from "../pipeline.js";

await Actor.init();

const input = (await Actor.getInput()) ?? {};

const companies = input.companies ?? ["airbnb", "stripe", "figma"];
const level = input.level ?? null;
const location = input.location ?? null;
const changesOnly = input.changesOnly ?? true;

const store = await Actor.openKeyValueStore("job-state");

const previous = await store.getValue("jobs") ?? {};
const current = { ...previous };
const now = new Date().toISOString();

const allOutput = [];

for (const company of companies) {
  try {
    const jobs = await fetchProvider("greenhouse", company);
    const normalized = jobs.map(normalizeJob);

    const matches = filterJobs(normalized, {
      level,
      location
    });

    const matchedIds = new Set(
      matches.map(job => String(job.id))
    );

    const seenIds = new Set();

    for (const job of normalized) {
      const id = `${company}:${job.id}`;
      seenIds.add(String(job.id));

      const existing = previous[id];

      let status = "UNCHANGED";

      if (!existing) {
        status = "NEW";
      } else if (
        existing.title !== job.title ||
        existing.location !== job.location ||
        existing.url !== job.url ||
        existing.updated_at !== job.updated_at ||
        existing.experience_level !== job.experience_level ||
        existing.job_type !== job.job_type
      ) {
        status = "UPDATED";
      }

      current[id] = {
        ...job,
        first_seen: existing?.first_seen ?? now,
        last_seen: now,
        status
      };

      if (matchedIds.has(String(job.id))) {
        if (!changesOnly || status !== "UNCHANGED") {
          allOutput.push({
            id: job.id,
            company: job.company,
            title: job.title,
            location: job.location,
            url: job.url,
            experience_level: job.experience_level,
            job_type: job.job_type,
            status
          });
        }
      }
    }

    for (const [id, oldJob] of Object.entries(previous)) {
      if (
        oldJob.company === company &&
        !seenIds.has(String(oldJob.id))
      ) {
        const closed = {
          ...oldJob,
          status: "CLOSED",
          last_seen: now
        };

        current[id] = closed;

        if (!changesOnly) {
          allOutput.push({
            id: closed.id,
            company: closed.company,
            title: closed.title,
            location: closed.location,
            url: closed.url,
            experience_level: closed.experience_level,
            job_type: closed.job_type,
            status: "CLOSED"
          });
        }
      }
    }

    console.log(
      `${company}: ${jobs.length} total → ${matches.length} matches`
    );

  } catch (error) {
    console.error(`${company}: ${error.message}`);

    // IMPORTANT:
    // Keep previous state for this company.
    // A source failure must never turn existing jobs into CLOSED.

    await Actor.pushData({
      company,
      source: "greenhouse",
      status: "SOURCE_ERROR",
      error: error.message
    });
  }
}

await store.setValue("jobs", current);

await Actor.pushData({
  generated_at: now,
  changes_only: changesOnly,
  total_changes: allOutput.filter(
    job => job.status !== "UNCHANGED"
  ).length,
  jobs: allOutput
});

await Actor.exit();
