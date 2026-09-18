import { sendTelegram } from "./telegram.js";

export async function alertForChanges(results){
  const changed=results.filter(r=>r.changed);
  for(const item of changed){
    await sendTelegram(
      `🚨 API Watcher\n\n${item.name} changed.\n\n${item.url}\n\nCheck the source before your next deployment.`
    );
  }
  return changed.length;
}
