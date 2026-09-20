import { classifyExperience } from "./filters/experience.js";
import { classifyJobType } from "./filters/jobType.js";
import { isSoftwareRole } from "./filters/software.js";
import { isIndiaLocation } from "./filters/location.js";

export function normalizeJob(job) {
  return {
    ...job,
    experience_level: classifyExperience(job.title),
    job_type: classifyJobType(job),
    first_seen: job.first_seen ?? null,
    last_seen: job.last_seen ?? null,
    status: job.status ?? "NEW"
  };
}

export function filterJobs(jobs, options = {}) {
  const {
    level = null,
    location = null
  } = options;

  return jobs
    .filter(isSoftwareRole)
    .filter(isIndiaLocation)
    .map(normalizeJob)
    .filter(job =>
      !level ||
      job.experience_level === level.toUpperCase()
    )
    .filter(job =>
      !location ||
      job.location.toLowerCase().includes(
        location.toLowerCase()
      )
    );
}
