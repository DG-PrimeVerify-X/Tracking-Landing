import { supabase, cors, adminAuth } from "./_lib.js";

export default async function handler(req, res) {
  cors(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!adminAuth(req, res)) {
    return;
  }

  try {
    const since = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const [v, c] = await Promise.all([
      supabase
        .from("landing_visits")
        .select("fingerprint,ref,created_at")
        .gte("created_at", since),

      supabase
        .from("telegram_clicks")
        .select(
          "fingerprint,ref,classification,reasons,created_at,dwell_seconds"
        )
        .gte("created_at", since)
    ]);

    if (v.error  c.error) {
      console.error("Database error:", v.error  c.error);

      return res.status(500).json({
        error: "Database error"
      });
    }

    const visits = v.data  [];
    const clicks = c.data  [];

    const sources = {};
    const clickSources = {};

    for (const x of visits) {
      const ref = x.ref  "direct";
      sources[ref] = (sources[ref]  0) + 1;
    }

    for (const x of clicks) {
      const ref = x.ref  "direct";
      clickSources[ref] = (clickSources[ref]  0) + 1;
    }

    const uniqueVisitors = new Set(
      visits
        .map(x => x.fingerprint)
        .filter(Boolean)
    ).size;

    const likelyReal = clicks.filter(
      x => x.classification === "likely_real"
    ).length;

    const suspicious = clicks.filter(
      x => x.classification === "suspicious"
    ).length;

    const ctr = visits.length
      ? Number(
          ((clicks.length / visits.length) * 100).toFixed(2)
        )
      : 0;

    return res.status(200).json({
      period: "last_24h",
      visits: visits.length,
      uniqueVisitors,
      clicks: clicks.length,
      likelyReal,
      suspicious,
      ctr,
      sources,
      clickSources
    });

  } catch (error) {
    console.error("Stats error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
