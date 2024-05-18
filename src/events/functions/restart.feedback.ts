import Database from "../../database";
import client from "../../saphire";
import { e } from "../../util/json";
import { t } from "../../translator";

export default async function feedbackAfterRestart(): Promise<any> {

  if (!client.user?.id || typeof client.shardId !== "number") return setTimeout(async () => await feedbackAfterRestart(), 2500);
  if (client.shardId !== 0) return;

  const data = await Database.Client.findOne({ id: client.user.id })
    .then(res => res?.toJSON())
    .catch(() => { });

  if (!data?.rebooting?.webhooks?.length) return;

  for await (const { url, locale } of data.rebooting.webhooks) {
    if (!url) continue;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "Saphire - Global System Notification",
        avatar_url: "https://cdn.saphire.one/saphire/web.png",
        content: t("Saphire.rebooting.ok", { e, locale: locale || client.defaultLocale })
      })
    })
      .catch(console.log);

    await sleep(1500);
    continue;
  }

  await Database.Client.updateOne(
    { id: client.user.id },
    { $unset: { rebooting: true } }
  );

  await sleep(1500);
}