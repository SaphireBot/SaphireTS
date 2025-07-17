import { discloud } from "discloud.app";
import { urls } from "../../util/constants";
import { setTimeout as sleep } from "timers/promises";
import client from "../../saphire";
import { env } from "process";

const statusChecking: Record<string, boolean> = {};

const links = {
  "site": urls.saphireSiteUrl,
  // "ways": urls.saphireApiUrl,
  "link": urls.saphireApiUrl,
  "twitch": urls.saphireTwitch,
};

export default async function keeponline() {

  if (
    client.shardId !== 0
    || env.MACHINE === "localhost"
  ) return;

  const status = await discloud.apps.fetch("all")
    .catch(() => null);

  if (status?.size) {
    for await (const data of status.values()) {

      if (["912509487984812043", "1752031320475"].includes(data.id)) continue;

      const status = await fetch(links[data.id as keyof typeof links] + "/ping").then(res => res.status).catch(() => 500);
      if (status !== 200) {
        console.log(`${data.id} didnt respond... Restarting...`);
        statusChecking[data.id] = true;
        await reload(data.id);
        await sleep(10000);
      } else {
        if (statusChecking[data.id]) {
          console.log(`${data.id} is online now.`);
          delete statusChecking[data.id];
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