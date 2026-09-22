import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";
import { db } from "./db.js";

const USER_AGENT="API-Watcher-Uptime/1.0 (+https://github.com/akashsirra/api-watcher)";

function isPrivateIp(ip){
  if(net.isIPv4(ip)){
    const [a,b]=ip.split(".").map(Number);
    return a===10 || a===127 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168) || a===0;
  }
  return ip==="::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:");
}

async function assertPublicUrl(raw){
  const url=new URL(raw);
  if(!["http:","https:"].includes(url.protocol)) throw new Error("Only http:// and https:// URLs are supported");
  if(url.username || url.password) throw new Error("URLs with embedded credentials are not allowed");
  const host=url.hostname;
  if(host==="localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("Private/local hosts are not allowed");
  if(net.isIP(host) && isPrivateIp(host)) throw new Error("Private IP addresses are not allowed");
  if(!net.isIP(host)){
    const records=await dns.lookup(host,{all:true});
    if(!records.length || records.some(r=>isPrivateIp(r.address))) throw new Error("Host resolves to a private IP");
  }
  return url;
}

export async function validateMonitorUrl(raw){ return String((await assertPublicUrl(raw)).href); }

async function requestMonitor(monitor){
  const started=performance.now();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),monitor.timeout_ms);
  try{
    const response=await fetch(monitor.url,{
      method:monitor.method,
      headers:{...JSON.parse(monitor.headers_json||"{}"),"user-agent":USER_AGENT},
      body:monitor.method==="GET"||monitor.method==="HEAD"?undefined:monitor.body||undefined,
      redirect:"follow",
      signal:controller.signal
    });
    const latency=Math.round(performance.now()-started);
    const ok=response.status>=200&&response.status<400&&(monitor.expected_status?response.status===monitor.expected_status:true);
    return {ok,status_code:response.status,latency_ms:latency,error:null};
  }catch(error){
    return {ok:false,status_code:null,latency_ms:Math.round(performance.now()-started),error:error.name==="AbortError"?"timeout":error.message};
  }finally{ clearTimeout(timeout); }
}

export async function checkMonitor(monitor){
  const result=await requestMonitor(monitor);
  const now=new Date().toISOString();
  db.prepare("INSERT INTO uptime_checks(monitor_id,checked_at,ok,status_code,latency_ms,error) VALUES(?,?,?,?,?,?)")
    .run(monitor.id,now,result.ok?1:0,result.status_code,result.latency_ms,result.error);
  db.prepare("UPDATE monitors SET last_checked_at=?,last_status=?,last_latency_ms=? WHERE id=?")
    .run(now,result.ok?"up":"down",result.latency_ms,monitor.id);
  return {...result,checkedAt:now};
}

export async function checkAllMonitors(){
  const monitors=db.prepare("SELECT * FROM monitors WHERE enabled=1 ORDER BY id").all();
  const results=[];
  for(const monitor of monitors){
    try{ results.push({slug:monitor.slug,name:monitor.name,...await checkMonitor(monitor)}); }
    catch(error){ results.push({slug:monitor.slug,name:monitor.name,ok:false,error:error.message}); }
  }
  return results;
}

export function uptimeStats(monitorId, hours=24){
  const since=new Date(Date.now()-hours*3600_000).toISOString();
  const row=db.prepare(`SELECT COUNT(*) total,
    COALESCE(SUM(ok),0) successful,
    COALESCE(AVG(CASE WHEN ok=1 THEN latency_ms END),0) avg_latency,
    COALESCE((SELECT latency_ms FROM uptime_checks c2 WHERE c2.monitor_id=? AND c2.checked_at>=? AND c2.ok=1 ORDER BY latency_ms LIMIT 1),0) min_latency,
    COALESCE((SELECT latency_ms FROM uptime_checks c3 WHERE c3.monitor_id=? AND c3.checked_at>=? AND c3.ok=1 ORDER BY latency_ms DESC LIMIT 1),0) max_latency
    FROM uptime_checks WHERE monitor_id=? AND checked_at>=?`).get(monitorId,since,monitorId,since,monitorId,since);
  return {...row,uptime:row.total?Number(((row.successful/row.total)*100).toFixed(2)):null};
}

export function badgeSvg(label,value,ok=true){
  const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const left=label.length*7+16,right=String(value).length*7+16,total=left+right;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${esc(label)}: ${esc(value)}"><title>${esc(label)}: ${esc(value)}</title><linearGradient id="g" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-opacity="0"/><stop offset="1" stop-opacity=".1"/></linearGradient><rect width="${total}" height="20" rx="3" fill="#555"/><rect x="${left}" width="${right}" height="20" fill="${ok?"#2da44e":"#cf222e"}"/><path fill="url(#g)" d="M0 0h${total}v20H0z"/><g fill="#fff" text-anchor="middle" font-family="Verdana,Arial,sans-serif" font-size="11"><text x="${left/2}" y="14">${esc(label)}</text><text x="${left+right/2}" y="14">${esc(value)}</text></g></svg>`;
}
