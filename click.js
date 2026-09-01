import { supabase, cors, clean, fingerprint, classify } from "./_lib.js";

export default async function handler(req,res){
  cors(res, req.headers.origin);
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const b=req.body||{};
  const fp=fingerprint(req);

  const since=new Date(Date.now()-10*60*1000).toISOString();
  const recent=await supabase
    .from("telegram_clicks")
    .select("id")
    .eq("fingerprint",fp)
    .gte("created_at",since);

  const c=classify(req,b,recent.data||[]);

  const row={
    session_id:clean(b.sessionId,100),
    fingerprint:fp,
    ref:clean(b.ref,100),
    utm_medium:clean(b.utm_medium,100),
    utm_campaign:clean(b.utm_campaign,150),
    utm_content:clean(b.utm_content,150),
    landing_page:clean(b.landingPage,1000),
    referrer:clean(b.referrer,1000),
    user_agent:clean(req.headers["user-agent"],1000),
    dwell_seconds:Number(b.dwellSeconds||0),
    classification:c.label,
    reasons:c.reasons,
    ip_hash:fp
  };

  const {error}=await supabase.from("telegram_clicks").insert(row);
  if(error) return res.status(500).json({error:"Database error"});
  return res.status(200).json({ok:true,classification:c.label});
}