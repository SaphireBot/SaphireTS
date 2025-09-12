import { ChatInputCommandInteraction, Message, Collection, User } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { setTimeout as sleep } from "node:timers/promises";
import { randomBytes } from "node:crypto";
import { guildsThatHasBeenFetched } from "./constants";
import replyAndGetMessage from "../../../util/replyAndGetMessage";

export default async function remove(
  interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
): Promise<any> {

  const { guild, member, userLocale: locale, channel, guildId } = interactionOrMessage;

  const reason = interactionOrMessage instanceof ChatInputCommandInteraction
    ? interactionOrMessage.options.getString("reason") || t("ban.no_reason_given", guild.preferredLocale)
    : t("ban.no_reason_given", guild.preferredLocale);

  const msg = await replyAndGetMessage(
    interactionOrMessage,
    { content: t("ban.remove.loading", { e, locale }) },
  );

  if (!msg) return;

  if (!guildsThatHasBeenFetched.has(guildId)) {
    guildsThatHasBeenFetched.add(guildId);
    await guild.bans.fetch().catch((error: Error) => error);
  }

  const bans = guild.bans.cache;

  const users = interactionOrMessage instanceof ChatInputCommandInteraction
    ? (() => {
      const queries = interactionOrMessage.options.getString("users", true).trim().split(/ /g).map(str => str.toLowerCase());
      const col = new Collection<string, User>();

      for (const ban of bans.values()) {
        if (
          queries.includes(ban.user.id)
          || queries.includes(ban.user.username)
          || (ban.user.globalName && queries.includes(ban.user.globalName))
        ) {
          col.set(ban.user.id, ban.user);
          continue;
        }
      }

      return col;
    })()
    : await (async () => {
      if (interactionOrMessage.partial) await interactionOrMessage.fetch().catch(() => { });
      return (await interactionOrMessage.parseUserMentions()).filter(user => bans.has(user.id));
    })();

  const success = new Collection<string, User>();
  const fail = new Collection<string, User>();

  if (!users.size)
    return await msg.edit({ content: t("ban.remove.no_user_found", { e, locale }) });

  const code = randomBytes(5).toString("base64url").toUpperCase();
  const cancel = t("ban.cancel", locale);

  if (users.size === 1) return await execute();

  await msg.edit({
    content: t("ban.remove.confirm", {
      e,
      locale,
      users: users.map(user => `\`${user.username} - ${user.id}\``).join(", "),
      code,
      cancel,
    }).limit("MessageContent"),
  });

  const collector = channel?.createMessageCollector({
    filter: msg => msg.author.id === member!.id,
    time: 1000 * 60,
  })
    .on("collect", async (msg): Promise<any> => {

      if (msg.content === code) {
        collector?.stop();
        return execute();
      }

      if (msg.content === cancel) return collector?.stop("cancel");

    })
    .on("end", async (_, reason): Promise<any> => {
      if (["time", "cancel"].includes(reason))
        return await msg.edit({
          content: t("ban.remove.cancel", { e, locale }),
        }).catch(() => { });
    });

  return;

  async function execute() {

    for await (const user of users.values()) {
      await guild.bans.remove(user?.id, `${user.username}: ${reason.limit(100)}`)
        .then(ban => (ban?.id ? success : fail).set(user.id, user))
        .catch(() => fail.set(user.id, user));

      await msg?.edit({
        content: t("ban.remove.feedback", {
          e,
          locale,
          success: success.size,
          users: users.size,
        }),
      });

      await sleep(1700);
    }

    return await msg?.edit({
      content: t("ban.remove.finish", {
        e,
        locale,
        success: success.size,
        fail: fail.size,
      }),
    });
  }
}