import express from "express";
import { checkAll } from "./watcher.js";
import { alertForChanges } from "./alerts.js";
import { db } from "./db.js";
import { checkAllMonitors, uptimeStats, badgeSvg, validateMonitorUrl } from "./uptime.js";

const app=express();
app.use(express.json({limit:"32kb"}));

app.get("/",(_,res)=>res.json({name:"API Watcher",version:"0.2.0",status:"ok",features:["changelog-monitoring","verified-api-uptime-badges"]}));
app.get("/health",(_,res)=>res.json({ok:true}));
app.get("/api/sources",(_,res)=>res.json(db.prepare("SELECT id,slug,name,url,last_hash,checked_at FROM sources ORDER BY name").all()));
app.get("/api/changes",(_,res)=>res.json(db.prepare("SELECT changes.*,sources.name FROM changes JOIN sources ON sources.id=changes.source_id ORDER BY detected_at DESC LIMIT 100").all()));

app.get("/api/monitors",(_,res)=>res.json(db.prepare("SELECT id,slug,name,url,method,expected_status,timeout_ms,enabled,last_checked_at,last_status,last_latency_ms FROM monitors ORDER BY name").all()));

app.post("/api/monitors",async(req,res)=>{
  try{
    const {slug,name,url,method="GET",expectedStatus=200,timeoutMs=10000,headers={},body=null}=req.body||{};
    if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(slug||"")) return res.status(400).json({error:"slug must contain 2-64 lowercase letters, numbers or hyphens"});
    if(!name||!url) return res.status(400).json({error:"name and url are required"});
    if(!["GET","HEAD","POST","PUT","PATCH"].includes(method)) return res.status(400).json({error:"unsupported method"});
    const safeUrl=await validateMonitorUrl(url);
    if(!Number.isInteger(expectedStatus)||expectedStatus<100||expectedStatus>599) return res.status(400).json({error:"expectedStatus must be an HTTP status"});
    if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>30000) return res.status(400).json({error:"timeoutMs must be 1000-30000"});
    const row=db.prepare(`INSERT INTO monitors(slug,name,url,method,expected_status,timeout_ms,headers_json,body)
      VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name,url=excluded.url,method=excluded.method,expected_status=excluded.expected_status,timeout_ms=excluded.timeout_ms,headers_json=excluded.headers_json,body=excluded.body`).run(slug,name,safeUrl,method,expectedStatus,timeoutMs,JSON.stringify(headers),body);
    res.status(201).json(db.prepare("SELECT * FROM monitors WHERE id=?").get(row.lastInsertRowid));
  }catch(error){res.status(400).json({error:error.message});}
});

app.post("/api/uptime/check",async(_,res)=>{
  try{res.json({checkedAt:new Date().toISOString(),results:await checkAllMonitors()});}
  catch(error){res.status(500).json({error:error.message});}
});

app.get("/api/monitors/:slug",(req,res)=>{
  const monitor=db.prepare("SELECT id,slug,name,url,method,expected_status,timeout_ms,enabled,last_checked_at,last_status,last_latency_ms FROM monitors WHERE slug=?").get(req.params.slug);
  if(!monitor) return res.status(404).json({error:"monitor not found"});
  res.json({...monitor,stats24h:uptimeStats(monitor.id,24),stats30d:uptimeStats(monitor.id,24*30)});
});

app.get("/badge/:slug/:metric",(req,res)=>{
  const monitor=db.prepare("SELECT * FROM monitors WHERE slug=?").get(req.params.slug);
  if(!monitor) return res.status(404).type("image/svg+xml").send(badgeSvg("API","not found",false));
  const stats=uptimeStats(monitor.id,24);
  let label,value;
  if(req.params.metric==="uptime"){label="uptime";value=stats.uptime===null?"no data":`${stats.uptime}%`;}
  else if(req.params.metric==="latency"){label="latency";value=stats.avg_latency?Math.round(stats.avg_latency)+"ms":"no data";}
  else return res.status(404).json({error:"metric must be uptime or latency"});
  res.set("Cache-Control","public, max-age=60, s-maxage=60").type("image/svg+xml").send(badgeSvg(label,value,monitor.last_status!=="down"));
});

app.get("/status/:slug",(req,res)=>{
  const monitor=db.prepare("SELECT * FROM monitors WHERE slug=?").get(req.params.slug);
  if(!monitor) return res.status(404).send("Monitor not found");
  const s=uptimeStats(monitor.id,24);
  const uptime=s.uptime===null?"No data":s.uptime+"%";
  const latency=s.avg_latency?Math.round(s.avg_latency)+" ms":"No data";
  const state=monitor.last_status==="up"?"Operational":monitor.last_status==="down"?"Incident":"Awaiting first check";
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${monitor.name} — API Watcher</title><style>body{font-family:system-ui;max-width:760px;margin:60px auto;padding:0 20px;color:#111}main{border:1px solid #ddd;border-radius:16px;padding:28px}h1{margin-bottom:8px}.state{font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px}.card{padding:18px;border:1px solid #eee;border-radius:12px}.value{font-size:28px;font-weight:700}a{color:#0969da}</style></head><body><main><h1>${monitor.name}</h1><p class="state">● ${state}</p><div class="grid"><div class="card"><div>Verified uptime · 24h</div><div class="value">${uptime}</div></div><div class="card"><div>Average latency · 24h</div><div class="value">${latency}</div></div></div><p>Endpoint: <code>${monitor.url}</code></p><p>Last checked: ${monitor.last_checked_at||"never"}</p><p><small>Metrics verified by API Watcher. <a href="/badge/${monitor.slug}/uptime">uptime badge</a> · <a href="/badge/${monitor.slug}/latency">latency badge</a></small></p></main></body></html>`);
});

app.post("/api/check",async(_,res)=>{
  try{const results=await checkAll();const alerts=await alertForChanges(results);res.json({checkedAt:new Date().toISOString(),alerts,results});}
  catch(error){res.status(500).json({error:error.message});}
});

const port=Number(process.env.PORT||8000);
app.listen(port,"0.0.0.0",()=>console.log(`API Watcher listening on :${port}`));
