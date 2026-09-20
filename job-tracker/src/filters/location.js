const INDIA_LOCATIONS = [
  "india",
  "bangalore",
  "bengaluru",
  "hyderabad",
  "pune",
  "chennai",
  "mumbai",
  "gurgaon",
  "gurugram",
  "noida",
  "delhi",
  "remote - india",
  "remote india"
];

export function isIndiaLocation(job) {
  const location = (job.location ?? "").toLowerCase();

  return INDIA_LOCATIONS.some(signal =>
    location.includes(signal)
  );
}
