const token=process.env.TELEGRAM_BOT_TOKEN;
const chatId=process.env.TELEGRAM_CHAT_ID;

export async function sendTelegram(text){
  if(!token || !chatId) return {sent:false,reason:"telegram_not_configured"};
  const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({chat_id:chatId,text,disable_web_page_preview:true})
  });
  if(!response.ok) throw new Error(`Telegram API ${response.status}: ${await response.text()}`);
  return {sent:true};
}
