import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

export function cors(res, origin) {
  const allowed = process.env.ALLOWED_ORIGIN  "*";

  res.setHeader("Access-Control-Allow-Origin", allowed);
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,X-Admin-Key"
  );
  res.setHeader("Vary", "Origin");
}

export function clean(v, max = 500) {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function fingerprint(req) {
  const forwarded = req.headers["x-forwarded-for"]  "";
  const ip = String(forwarded).split(",")[0].trim()  "unknown";
  const ua = req.headers["user-agent"]  "";

  return cryptoHash(ip + "|" + ua);
}

function cryptoHash(s) {
  let h = 2166136261;

  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}

export function classify(req, body, recentClicks = []) {
  const ua = req.headers["user-agent"]  "";
  const reasons = [];

  if (
    !ua 
    /bot|crawler|spider|headless|selenium|playwright|phantom/i.test(ua)
  ) {
    reasons.push("bot-like user agent");
  }

  const dwell = Number(body.dwellSeconds  0);

  if (dwell > 0 && dwell < 1) {
    reasons.push("sub-second dwell");
  }

  if (recentClicks.length >= 6) {
    reasons.push("high click frequency");
  }

  if (reasons.length > 0) {
    return {
      label: "suspicious",
      reasons
    };
  }

  return {
    label: "likely_real",
    reasons: []
  };
}

export function adminAuth(req, res) {
  const supplied = req.headers["x-admin-key"];

  if (
    !process.env.ADMIN_KEY 
    supplied !== process.env.ADMIN_KEY
  ) {
    res.status(401).json({
      error: "Unauthorized"
    });
    return false;
  }

  return true;
}
