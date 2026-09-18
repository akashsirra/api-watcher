import crypto from "node:crypto";
import * as cheerio from "cheerio";
import { db, upsertSource } from "./db.js";
import { SOURCES } from "./sources.js";

const headers={"user-agent":"API-Watcher/0.2 (+https://github.com/akashsirra/api-watcher)"};

async function fetchText(url){
  const response=await fetch(url,{headers,redirect:"follow"});
  if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html=await response.text();
  const $=cheerio.load(html);
  $("script,style,noscript").remove();
  return $("body").text().replace(/\s+/g," ").trim();
}

function summarizeChange(previous,current,name){
  if(!previous) return `${name} baseline captured`;
  const before=new Set(previous.split(/(?<=[.!?])\s+/));
  const after=current.split(/(?<=[.!?])\s+/);
  const added=after.filter(sentence=>sentence.length>20 && !before.has(sentence)).slice(0,3);
  if(!added.length) return `${name} changelog changed; review the source for details`;
  return `${name} changed. New content: ${added.join(" | ")}`;
}

export async function checkSource(source){
  const row=upsertSource(source);
  const content=await fetchText(source.url);
  const hash=crypto.createHash("sha256").update(content).digest("hex");
  const changed=Boolean(row.last_hash && row.last_hash!==hash);
  const now=new Date().toISOString();
  const summary=changed?summarizeChange(row.last_content,content,source.name):null;

  db.prepare("UPDATE sources SET last_hash=?,last_content=?,checked_at=? WHERE id=?")
    .run(hash,content,now,row.id);

  if(changed){
    db.prepare("INSERT INTO changes(source_id,detected_at,previous_hash,current_hash,summary,url) VALUES(?,?,?,?,?,?)")
      .run(row.id,now,row.last_hash,hash,summary,source.url);
  }

  return {
    name:source.name,
    url:source.url,
    firstSeen:!row.last_hash,
    changed,
    summary,
    checkedAt:now
  };
}

export async function checkAll(){
  const results=[];
  for(const source of SOURCES){
    try{results.push(await checkSource(source));}
    catch(error){results.push({name:source.name,url:source.url,error:error.message});}
  }
  return results;
}
