import { ChatInputCommandInteraction, Message, Collection, User, time, ButtonStyle, GuildMember, PermissionsBitField } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { BanManager } from "../../../managers";
import client from "../../../saphire";
import { guildsThatHasBeenFetched } from "./constants";

export default async function add(
  interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>
): Promise<any> {

  const { userLocale: locale, guild, guildId, member } = interactionOrMessage;
  const author = member!.user;

  const msg = await interactionOrMessage.reply({
    content: t("ban.add.loading", { e, locale }),
    fetchReply: true
  })
    .catch(() => null);

  if (!msg) return;

  if (!guildsThatHasBeenFetched.has(guildId)) {
    guildsThatHasBeenFetched.add(guildId);
    await guild.bans.fetch().catch((error: Error) => error);
  }

  if (interactionOrMessage instanceof Message)
    await interactionOrMessage.parseMentions();

  const bans = guild.bans.cache;
  const imunes = new Collection<string, User>();
  const members = interactionOrMessage instanceof ChatInputCommandInteraction
    ? new Collection<string, GuildMember>()
    : interactionOrMessage.mentions.members.clone();

  let users = interactionOrMessage instanceof ChatInputCommandInteraction
    ? await (async () => {
      const queries = interactionOrMessage.options.getString("users", true).trim().split(/ /g).map(str => str.toLowerCase());
      const col = new Collection<string, User>();

      for await (const query of queries) {
        const user = client.users.searchBy(query) || await client.users.fetch(query).catch(() => null);
        if (user && !bans.has(user.id)) {
          const member = await guild.members.fetch(user.id).catch(() => null);
          if (member) members.set(user.id, member);
          col.set(user.id, user);
        }
      }

      return col;
    })()
    : interactionOrMessage.mentions.users.clone();

  users = users.filter(user => !bans.has(user.id));

  for (const member of members.values()) {
    if (
      (member.roles.highest.comparePositionTo(member.roles.highest) >= 1)
      || member.permissions.any([PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.ManageGuild], true)
    ) {
      imunes.set(member.id, member.user);
      members.delete(member.id);
      users.delete(member.id);
      continue;
    }
  }

  let content = "";

  if (imunes.size) {
    content += `${t("ban.add.imunes", { e, locale })}\n`;

    if (!users.size)
      return await msg.edit({ content });
  }

  if (!users?.size) {
    content += `${t("ban.add.no_user_found", { e, locale })}\n`;
    return await msg.edit({ content });
  }

  let timeMs = interactionOrMessage instanceof ChatInputCommandInteraction
    ? interactionOrMessage.options.getString("time")?.toDateMS()
    : interactionOrMessage.content.toDateMS();
  if (timeMs && timeMs < 5000) timeMs = 5000;

  const reason = interactionOrMessage instanceof ChatInputCommandInteraction
    ? interactionOrMessage.options.getString("reason") || t("ban.add.no_reason", { locale: guild.preferredLocale, user: author })
    : t("ban.add.banned_by", { locale: guild.preferredLocale, user: author });

  content += `${t("ban.add.ask_for_the_ban", {
    e,
    locale,
    size: users.size,
    users: Array.from(users.values()).map(u => `\`${u?.username}\``).format(locale),
    time: timeMs ? t("ban.add.banned_until", { locale, time: `\`${Date.stringDate(timeMs, false, locale)}\`` }) : t("ban.add.permanent", locale),
    end: t("ban.add.until_end", { locale, time: time(new Date(Date.now() + 15000), "R") })
  })}`;

  await msg.edit({
    content,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("keyword_confirm", locale),
            custom_id: "accept",
            style: ButtonStyle.Danger
          },
          {
            type: 2,
            label: t("keyword_refuse", locale),
            custom_id: "refuse",
            style: ButtonStyle.Success
          }
        ]
      }
    ]
  });

  const banneds = new Set<string>();
  const unbanneds = new Set<string>();

  const collector = msg.createMessageComponentCollector({
    filter: int => int.user.id === author.id,
    time: 1000 * 15,
    max: 1
  })
    .on("collect", async (int): Promise<any> => {
      const { customId } = int;

      if (customId === "refuse")
        return collector.stop("refuse");

      await int.update({
        content: t("ban.add.banning", { e, locale, users }),
        components: users.size > 1
          ? [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: t("keyword_confirm", locale),
                  custom_id: "accept",
                  style: ButtonStyle.Danger,
                  disabled: true
                },
                {
                  type: 2,
                  label: t("keyword_refuse", locale),
                  custom_id: "cancel",
                  style: ButtonStyle.Success
                }
              ]
            }
          ]
          : []
      });

      if (users.size === 1) {
        const user = Array.from(users.values())?.[0];
        if (typeof timeMs === "number" && timeMs > 0)
          BanManager.set(guildId, user.id, timeMs);

        return await guild.bans.create(user.id, { deleteMessageSeconds: 0, reason })
          .then(async () => await int.editReply({
            content: t("ban.add.user_banned", {
              e,
              locale,
              user,
              time: timeMs ? t("ban.add.banned_until_day", { locale, time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}` }) : t("ban.add.permanent", locale),
              reason
            })
          }))
          .catch(async err => await int.editReply({
            content: t("ban.add.fail", {
              e,
              locale,
              user,
              err: t(`Discord.Errors.${err.code}`, locale)
            })
          }));
      }

      const result = await guild.bans.bulkCreate(users, { deleteMessageSeconds: 0, reason }).catch(() => null);

      if (result) {
        for await (const userId of result.bannedUsers) {
          banneds.add(userId);
          if (typeof timeMs === "number" && timeMs > 0)
            await BanManager.set(guildId, userId, timeMs);
        }
        for (const userId of result.failedUsers)
          unbanneds.add(userId);
      }

      return await msg.edit({
        content: t("ban.add.success", {
          e,
          locale,
          users,
          banneds,
          unbanneds,
          reason,
          time: timeMs
            ? t("ban.add.banned_until_day", {
              locale,
              time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}`
            })
            : t("ban.add.permanent", locale)
        }),
        components: []
      });
    })
    .on("end", async (_, reason): Promise<any> => {
      if (["cancel", "user", "limit"].includes(reason)) return;
      return await msg.edit({ content: t("ban.add.cancelled", { e, locale }), components: [] }).catch(() => { });
    });

  return;
}