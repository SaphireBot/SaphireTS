import { Message, PermissionFlagsBits } from "discord.js";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { setTimeout as sleep } from "node:timers/promises";

export default {
  name: "unmute",
  description: "Unmute muted members",
  aliases: [],
  category: "moderation",
  api_data: {
    category: "Moderação",
    synonyms: [],
    tags: ["new"],
    perms: {
      user: [DiscordPermissons.ModerateMembers],
      bot: [DiscordPermissons.ModerateMembers]
    }
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {

    const { userLocale: locale, guild, author, member } = message;

    if (!member?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
      return await permissionsMissing(message, [DiscordPermissons.ModerateMembers], "Discord_you_need_some_permissions");

    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
      return await permissionsMissing(message, [DiscordPermissons.ModerateMembers], "Discord_client_need_some_permissions");

    const msg = await message.reply({ content: t("unmute.search_members", { e, locale }) });
    const members = (await message.parseMemberMentions());

    if (!members?.size)
      return await msg.edit({ content: t("unmute.no_members_found", { e, locale }) });

    let content = "";

    if (members.delete(client.user!.id))
      content += `${t("unmute.saphire_mute", { e, locale })}\n`;

    if (members.delete(author.id))
      content += `${t("unmute.you_cannot_mute_you", { e, locale })}\n`;

    if (!members.size && content.length)
      return await msg.edit({ content });

    let counter = 0;
    const clientHighestRole = guild.members.me?.roles.highest;
    for await (const member of members.values()) {
      if (!member?.id) continue;

      counter++;
      await msg.edit({ content: t("unmute.count", { e, locale, members: { size: members.size }, counter }) }).catch(() => { });

      if (clientHighestRole)
        if (member.roles.highest.comparePositionTo(clientHighestRole) >= 1) {
          content += `${t("unmute.client_no_perm", { e, locale, member })}`;
          await sleep(1500);
          continue;
        }

      if (member.id !== guild.ownerId)
        if (
          member.roles.highest.comparePositionTo(member.roles.highest) >= 1
          || member.permissions.has(PermissionFlagsBits.ModerateMembers, true)
        ) {
          content += `${t("unmute.no_perm", { e, locale, member })}\n`;
          await sleep(1500);
          continue;
        }

      content += member.communicationDisabledUntil
        ? await member.disableCommunicationUntil(null, `Unmuted my ${author.username}`)
          .then(member => `${t("unmute.unmuted", { e, locale, member })}\n`)
          .catch(err => `${t("unmute.unmuted_fail", { e, locale, member, err })}\n`)
        : `${t("unmute.no_muted", { e, locale, member })}\n`;

      if (counter === members.size) break;
      await sleep(1500);
    }

    content = content.limit("MessageContent");
    return await msg.edit({ content })
      .catch(async () => {
        await client.channels.send(msg.channelId, { content })
          .catch(() => { });
        return;
      });

  }
};