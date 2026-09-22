import { decideJobMatch } from "./jev.js";

export async function matchJobs(jobs, candidate) {
  const results = [];

  for (const job of jobs) {
    try {
      const decision = await decideJobMatch({ candidate, job });

      results.push({
        ...job,
        match: {
          skill_fit: decision.skill_fit?.score ?? null,
          skill_confidence: decision.skill_fit?.confidence ?? null,
          role_fit: decision.role_fit?.noul ?? null,
          role_confidence: decision.role_fit?.confidence ?? null,
          action: decision.application_action?.choice ?? "REVIEW",
          action_confidence: decision.application_action?.confidence ?? null,
          action_probabilities: decision.application_action?.probabilities ?? null
        }
      });
    } catch (error) {
      results.push({
        ...job,
        match: {
          error: error.message,
          action: "REVIEW"
        }
      });
    }
  }

  return results;
}
