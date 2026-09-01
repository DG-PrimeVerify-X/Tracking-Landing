import {
  supabase,
  cors,
  clean,
  fingerprint
} from "./_lib.js";

export default async function handler(req, res) {
  cors(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const b = req.body  {};
    const fp = fingerprint(req);

    const row = {
      session_id: clean(b.sessionId, 100),
      fingerprint: fp,
      ref: clean(b.ref, 100),
      utm_medium: clean(b.utm_medium, 100),
      utm_campaign: clean(b.utm_campaign, 150),
      utm_content: clean(b.utm_content, 150),
      landing_page: clean(b.landingPage, 1000),
      referrer: clean(b.referrer, 1000),
      user_agent: clean(req.headers["user-agent"], 1000),
      screen_width: Number(b.screenWidth  0),
      screen_height: Number(b.screenHeight || 0),
      timezone: clean(b.timezone, 100),
      ip_hash: fp
    };

    const { error } = await supabase
      .from("landing_visits")
      .insert(row);

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: "Database error"
      });
    }

    return res.status(200).json({
      ok: true
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
