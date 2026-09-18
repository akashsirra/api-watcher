import express from "express";
import { checkAll } from "./watcher.js";
import { db } from "./db.js";

const app=express();
app.use(express.json());

app.get("/",(_,res)=>res.json({name:"API Watcher",version:"0.1.0",status:"ok"}));
app.get("/health",(_,res)=>res.json({ok:true}));
app.get("/api/sources",(_,res)=>res.json(db.prepare("SELECT id,slug,name,url,last_hash,checked_at FROM sources ORDER BY name").all()));
app.get("/api/changes",(_,res)=>res.json(db.prepare("SELECT changes.*,sources.name FROM changes JOIN sources ON sources.id=changes.source_id ORDER BY detected_at DESC LIMIT 100").all()));
app.post("/api/check",async(_,res)=>{
  const results=await checkAll();
  res.json({checkedAt:new Date().toISOString(),results});
});

const port=Number(process.env.PORT||8000);
app.listen(port,"0.0.0.0",()=>console.log(`API Watcher listening on :${port}`));
