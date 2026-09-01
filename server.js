const express=require("express");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_KEY=process.env.ADMIN_KEY||"change-this-key";
const DB=path.join(__dirname,"data.json");

app.use(express.json({limit:"50kb"}));
app.use(express.static(__dirname));

function load(){try{return JSON.parse(fs.readFileSync(DB,"utf8"))}catch(e){return {visits:[],clicks:[]}}}
function save(db){fs.writeFileSync(DB,JSON.stringify(db,null,2))}
function clean(v,max=200){return typeof v==="string"?v.slice(0,max):""}
function fingerprint(req,body){
  const ip=(req.headers["x-forwarded-for"]||req.socket.remoteAddress||"").split(",")[0].trim();
  const ua=req.headers["user-agent"]||"";
  return crypto.createHash("sha256").update(ip+"|"+ua).digest("hex").slice(0,16);
}
function classify(req,body,db){
  const now=Date.now(), fp=fingerprint(req,body);
  const recent=db.clicks.filter(x=>x.fingerprint===fp && now-new Date(x.timestamp).getTime()<10*60*1000);
  const reasons=[];
  const ua=req.headers["user-agent"]||"";
  if(!ua || /bot|crawler|spider|headless|selenium|playwright/i.test(ua)) reasons.push("bot-like user agent");
  if(recent.length>=8) reasons.push("high click frequency");
  return {label:reasons.length?"suspicious":"likely_real",reasons,fingerprint:fp};
}
app.post("/api/visit",(req,res)=>{
  const b=req.body||{},db=load();
  const fp=fingerprint(req,b);
  db.visits.push({
    id:crypto.randomUUID(),timestamp:new Date().toISOString(),fingerprint:fp,
    sessionId:clean(b.sessionId),ref:clean(b.ref),utm_medium:clean(b.utm_medium),
    utm_campaign:clean(b.utm_campaign),utm_content:clean(b.utm_content),
    landingPage:clean(b.landingPage,500)
  });
  if(db.visits.length>10000) db.visits=db.visits.slice(-10000);
  save(db);res.json({ok:true});
});
app.post("/api/click",(req,res)=>{
  const b=req.body||{},db=load(),c=classify(req,b,db);
  db.clicks.push({
    id:crypto.randomUUID(),timestamp:new Date().toISOString(),fingerprint:c.fingerprint,
    sessionId:clean(b.sessionId),ref:clean(b.ref),utm_medium:clean(b.utm_medium),
    utm_campaign:clean(b.utm_campaign),utm_content:clean(b.utm_content),
    classification:c.label,reasons:c.reasons
  });
  if(db.clicks.length>10000) db.clicks=db.clicks.slice(-10000);
  save(db);res.json({ok:true,classification:c.label});
});
function auth(req,res,next){
  if(req.headers["x-admin-key"]!==ADMIN_KEY) return res.status(401).json({error:"Unauthorized"});
  next();
}
app.get("/api/stats",auth,(req,res)=>{
  const db=load(),cut=Date.now()-24*60*60*1000;
  const visits=db.visits.filter(x=>new Date(x.timestamp).getTime()>=cut);
  const clicks=db.clicks.filter(x=>new Date(x.timestamp).getTime()>=cut);
  const sources={};
  for(const v of visits) sources[v.ref||"direct"]=(sources[v.ref||"direct"]||0)+1;
  const clickSources={};
  for(const c of clicks) clickSources[c.ref||"direct"]=(clickSources[c.ref||"direct"]||0)+1;
  res.json({
    period:"last_24h",visits:visits.length,clicks:clicks.length,
    uniqueVisitors:new Set(visits.map(x=>x.fingerprint)).size,
    likelyReal:clicks.filter(x=>x.classification==="likely_real").length,
    suspicious:clicks.filter(x=>x.classification==="suspicious").length,
    ctr:visits.length?+(clicks.length/visits.length*100).toFixed(2):0,
    sources,clickSources
  });
});
app.get("/api/events",auth,(req,res)=>{
  const db=load();
  res.json({visits:db.visits.slice(-200).reverse(),clicks:db.clicks.slice(-200).reverse()});
});
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"admin.html")));
app.listen(PORT,()=>console.log(`DG BHAI 9X tracker running on ${PORT}`));