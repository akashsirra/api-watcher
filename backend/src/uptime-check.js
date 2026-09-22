import { checkAllMonitors } from "./uptime.js";
console.log(JSON.stringify(await checkAllMonitors(),null,2));
