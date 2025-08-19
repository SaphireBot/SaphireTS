import { Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { PearlsManager } from "../../../managers";

export default async function count(
  message: Message<true>,
) {

  const { userLocale: locale, guildId, author } = message;
  let loading = false;
  let msg: Message<true> | undefined;

  const timeout = setTimeout(async () => {
    loading = true;
    msg = await message.reply({
      content: t("pearl.count.loading", { e, locale }),
    });
  }, 2000);

  if (message.partial) await message.fetch().catch(() => { });
  const users = await message.parseUserMentions();

  if (!users?.size)
    users.set(author.id, author);

  let str = "";

  for (const user of users.values())
    str += `${t("pearl.count.data", {
      user,
      e,
      count: PearlsManager.count[guildId]?.[user.id] || 0,
    })}\n`;

  const content = str.limit("MessageContent");

  clearTimeout(timeout);
  if (loading) return await msg?.edit({ content }).catch(() => { });
  else return await message.reply({ content });
}