import { discloud } from "discloud.app";
import { urls } from "../../util/constants";
import { setTimeout as sleep } from "timers/promises";
import client from "../../saphire";

const statusChecking: Record<string, boolean> = {};

const links = {
  "site": urls.saphireSiteUrl,
  // "ways": urls.saphireApiUrl,
  "link": urls.saphireSiteUrl,
  "twitch": urls.saphireTwitch,
};

export default async function keeponline() {

  if (client.shardId !== 0) return;

  const status = await discloud.apps.status("all")
    .catch(() => null);

  if (status?.size) {
    for await (const data of status.values())
      if (data.appId !== "912509487984812043") {
        const status = await fetch(links[data.appId as keyof typeof links] + "/ping").then(res => res.status).catch(() => 500);
        if (status !== 200) {
          console.log(`${data.appId} didnt respond... Restarting...`);
          statusChecking[data.appId] = true;
          await reload(data.appId);
          await sleep(10000);
        } else {
          if (statusChecking[data.appId]) {
            console.log(`${data.appId} is online now.`);
            delete statusChecking[data.appId];
          }
          await sleep(2000);
        };
      }
  } else await sleep(1000 * 10);

  setTimeout(() => keeponline(), 5000);
  return;

}

async function reload(appName: string) {
  return await discloud.apps.restart(appName)
    .then(({ message }) => {
      console.log(appName, "DISCLOUD RESPONSE: ", message);
    })
    .catch(console.log);
}