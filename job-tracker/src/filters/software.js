const SOFTWARE_SIGNALS = [
  "software engineer",
  "software developer",
  "software engineering",
  "backend engineer",
  "backend developer",
  "frontend engineer",
  "frontend developer",
  "full stack engineer",
  "full-stack engineer",
  "application engineer",
  "platform engineer",
  "developer"
];

const NON_SOFTWARE = [
  "product manager",
  "project manager",
  "marketing",
  "recruiter",
  "recruiting",
  "customer support",
  "operations",
  "sales",
  "account manager"
];

export function isSoftwareRole(job) {
  const title = (job.title ?? "").toLowerCase();

  if (NON_SOFTWARE.some(signal => title.includes(signal))) {
    return false;
  }

  return SOFTWARE_SIGNALS.some(signal =>
    title.includes(signal)
  );
}
