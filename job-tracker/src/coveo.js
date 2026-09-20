export async function discoverCoveoReferences(html) {
  const refs = [...html.matchAll(/https?:[^"'\\s]+|\\/[^"'\\s]+/g)]
    .map(m => m[0])
    .filter(x => /coveo|job|career|search/i.test(x));
  return [...new Set(refs)];
}
