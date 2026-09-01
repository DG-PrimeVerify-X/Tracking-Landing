import {
  supabase,
  cors,
  adminAuth
} from "./_lib.js";

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
    const [v, c] = await Promise.all([
      supabase
        .from("landing_visits")
        .select("*")
        .order("created_at", {
          ascending: false
        })
        .limit(200),

      supabase
        .from("telegram_clicks")
        .select("*")
        .order("created_at", {
          ascending: false
        })
        .limit(200)
    ]);

    if (v.error  c.error) {
      console.error(v.error  c.error);

      return res.status(500).json({
        error: "Database error"
      });
    }

    return res.status(200).json({
      visits: v.data  [],
      clicks: c.data  []
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
