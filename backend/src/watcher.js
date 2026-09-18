import crypto from "node:crypto";
import * as cheerio from "cheerio";
import { db, upsertSource } from "./db.js";
import { SOURCES } from "./sources.js";

const headers={"user-agent":"API-Watcher/0.1 (+https://github.com/akashsirra/api-watcher)"};

async function fetchText(url){
  const response=await fetch(url,{headers,redirect:"follow"});
  if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html=await response.text();
  const $=cheerio.load(html);
  $("script,style,noscript").remove();
  return $("body").text().replace(/\\s+/g," ").trim();
}

export async function checkSource(source){
  const row=upsertSource(source);
  const content=await fetchText(source.url);
  const hash=crypto.createHash("sha256").update(content).digest("hex");
  const changed=Boolean(row.last_hash && row.last_hash!==hash);
  const now=new Date().toISOString();

  db.prepare("UPDATE sources SET last_hash=?,last_content=?,checked_at=? WHERE id=?")
    .run(hash,content,now,row.id);

  if(changed){
    db.prepare("INSERT INTO changes(source_id,detected_at,previous_hash,current_hash,summary,url) VALUES(?,?,?,?,?,?)")
      .run(row.id,now,row.last_hash,hash,source.name+" changelog changed",source.url);
  }
  return {name:source.name,url:source.url,firstSeen:!row.last_hash,changed,checkedAt:now};
}

export async function checkAll(){
  const results=[];
  for(const source of SOURCES){
    try{results.push(await checkSource(source));}
    catch(error){results.push({name:source.name,url:source.url,error:error.message});}
  }
  return results;
}
