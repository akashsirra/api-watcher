export const JOB_TYPES = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  INTERNSHIP: "INTERNSHIP",
  UNKNOWN: "UNKNOWN"
};

export function classifyJobType(job = {}) {
  const title = String(job.title ?? "").toLowerCase();

  if (/\bintern(?:ship)?\b/.test(title)) {
    return JOB_TYPES.INTERNSHIP;
  }

  if (/\bpart[- ]time\b/.test(title)) {
    return JOB_TYPES.PART_TIME;
  }

  if (/\bfull[- ]time\b/.test(title)) {
    return JOB_TYPES.FULL_TIME;
  }

  return JOB_TYPES.UNKNOWN;
}
