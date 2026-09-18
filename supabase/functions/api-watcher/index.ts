import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
const secretKeys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
const supabase=createClient(supabaseUrl,secretKeys["default"]);

const SOURCES=[
  {slug:"openai",name:"OpenAI",url:"https://platform.openai.com/docs/changelog"},
  {slug:"stripe",name:"Stripe",url:"https://docs.stripe.com/changelog"},
  {slug:"github",name:"GitHub",url:"https://github.blog/changelog/"},
  {slug:"twilio",name:"Twilio",url:"https://www.twilio.com/en-us/changelog"}
];

const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};

async function fetchText(url:string){
  const response=await fetch(url,{redirect:"follow",headers:{"user-agent":"API-Watcher/0.2"}});
  if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.text()).replace(/<[^>]*>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/\s+/g," ").trim();
}

async function sha256(value:string){
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function summarize(previous:string,current:string,name:string){
  if(!previous) return `${name} baseline captured`;
  const before=new Set(previous.split(/(?<=[.!?])\s+/));
  const added=current.split(/(?<=[.!?])\s+/).filter(s=>s.length>20&&!before.has(s)).slice(0,3);
  return added.length?`${name} changed. New content: ${added.join(" | ")}`:`${name} changelog changed; review the source for details`;
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers});
  const path=new URL(req.url).pathname;
  try{
    if(req.method==="GET"&&path.endsWith("/sources")){
      const {data,error}=await supabase.from("sources").select("id,slug,name,url,last_hash,checked_at").order("name");
      if(error) throw error;
      return new Response(JSON.stringify(data),{headers});
    }
    if(req.method==="GET"&&path.endsWith("/changes")){
      const {data,error}=await supabase.from("changes").select("id,source_id,detected_at,previous_hash,current_hash,summary,url").order("detected_at",{ascending:false}).limit(100);
      if(error) throw error;
      return new Response(JSON.stringify(data),{headers});
    }
    if(req.method==="POST"&&path.endsWith("/check")){
      let changedCount=0; const results=[];
      for(const source of SOURCES){
        const {data:row}=await supabase.from("sources").select("*").eq("slug",source.slug).maybeSingle();
        const content=await fetchText(source.url);
        const hash=await sha256(content);
        const changed=Boolean(row?.last_hash&&row.last_hash!==hash);
        const now=new Date().toISOString();
        const summary=changed?summarize(row?.last_content||"",content,source.name):null;
        const {data:saved,error:saveError}=await supabase.from("sources").upsert({slug:source.slug,name:source.name,url:source.url,last_hash:hash,last_content:content,checked_at:now},{onConflict:"slug"}).select("id").single();
        if(saveError) throw saveError;
        if(changed){
          const {error}=await supabase.from("changes").insert({source_id:saved.id,detected_at:now,previous_hash:row!.last_hash,current_hash:hash,summary,url:source.url});
          if(error) throw error;
          changedCount++;
        }
        results.push({name:source.name,url:source.url,firstSeen:!row?.last_hash,changed,summary,checkedAt:now});
      }
      return new Response(JSON.stringify({checkedAt:new Date().toISOString(),changed:changedCount,results}),{headers});
    }
    return new Response(JSON.stringify({name:"API Watcher",version:"0.2.0",status:"ok"}),{headers});
  }catch(error){
    return new Response(JSON.stringify({error:error instanceof Error?error.message:String(error)}),{status:500,headers});
  }
});
