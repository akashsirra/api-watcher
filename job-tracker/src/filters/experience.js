export const EXPERIENCE_LEVELS = {
  ENTRY: "ENTRY",
  MID: "MID",
  SENIOR: "SENIOR",
  UNKNOWN: "UNKNOWN"
};

const SENIOR_SIGNALS = [
  "senior",
  "staff",
  "principal",
  "lead",
  "manager",
  "director",
  "vice president",
  " vp "
];

const ENTRY_SIGNALS = [
  "intern",
  "internship",
  "entry level",
  "entry-level",
  "junior",
  "new grad",
  "new graduate",
  "graduate",
  "early career",
  "associate",
  "engineer i",
  "engineer 1",
  "developer i",
  "developer 1"
];

export function classifyExperience(title = "") {
  const text = title.toLowerCase();

  if (SENIOR_SIGNALS.some(signal => text.includes(signal))) {
    return EXPERIENCE_LEVELS.SENIOR;
  }

  if (ENTRY_SIGNALS.some(signal => text.includes(signal))) {
    return EXPERIENCE_LEVELS.ENTRY;
  }

  return EXPERIENCE_LEVELS.UNKNOWN;
}
