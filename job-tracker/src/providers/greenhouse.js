const GREENHOUSE = "https://boards-api.greenhouse.io/v1/boards";

async function fetchWithRetry(url, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "IndiaJobChangeTracker/0.1"
        }
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      clearTimeout(timer);
      lastError = error;

      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }

  throw new Error(
    `Greenhouse request failed after ${attempts} attempts: ${lastError?.message ?? "unknown error"}`
  );
}

export async function greenhouse(board) {
  const data = await fetchWithRetry(
    `${GREENHOUSE}/${board}/jobs?content=true`
  );

  return data.jobs.map(job => ({
    id: String(job.id),
    source: "greenhouse",
    company: board,
    title: job.title,
    location: job.location?.name ?? "",
    url: job.absolute_url,
    updated_at: job.updated_at ?? null,
    description: job.content ?? ""
  }));
}

export async function fetchProvider(provider, board) {
  if (provider === "greenhouse") {
    return greenhouse(board);
  }

  throw new Error(`Unknown provider: ${provider}`);
}
