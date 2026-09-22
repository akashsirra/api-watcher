const JEV_URL = "https://api.typesafe.ai/v1/systemone";

export async function decideJobMatch({ candidate, job }) {
  const apiKey = process.env.JEV_API_KEY;

  if (!apiKey) {
    throw new Error("JEV_API_KEY is not set. Add it to the environment before using --match.");
  }

  const state = {
    candidate,
    job: {
      title: job.title,
      company: job.company,
      location: job.location,
      experience_level: job.experience_level,
      job_type: job.job_type,
      description: job.description ?? ""
    }
  };

  const response = await fetch(JEV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "jev-latest",
      state,
      questions: {
        skill_fit: {
          type: "score",
          instructions: "How well do the candidate's listed skills match the technical skills and responsibilities in this job? Judge only from the supplied candidate and job information.",
          criteria: [
            "0 - Almost no relevant technical overlap",
            "1 - Limited overlap; major skill gaps",
            "2 - Some relevant overlap; several gaps",
            "3 - Strong overlap; most core requirements are covered",
            "4 - Very strong overlap; the candidate's skills directly match the core technical work"
          ]
        },
        role_fit: {
          type: "noul",
          instructions: "Is this job a plausible entry-level software engineering opportunity for this candidate based on the supplied role, experience level, job type, and candidate profile?"
        },
        application_action: {
          type: "choice",
          instructions: "What should the candidate do with this job after the deterministic India/software filters have passed?",
          criteria: {
            APPLY: "The role appears sufficiently aligned to apply now.",
            REVIEW: "The role has meaningful alignment but the candidate should inspect requirements before deciding.",
            SKIP: "The role appears poorly aligned despite passing the basic filters."
          }
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jev API HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  return {
    skill_fit: data.answers?.skill_fit ?? null,
    role_fit: data.answers?.role_fit ?? null,
    application_action: data.answers?.application_action ?? null,
    usage: data.usage ?? null,
    model: data.model ?? null
  };
}
