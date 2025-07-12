import { ChatInputCommandInteraction, Message, AttachmentBuilder, Collection, GuildBan, PermissionFlagsBits } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { guildsThatHasBeenFetched } from "./constants";
import { PermissionsTranslate } from "../../../util/constants";

export default async function list(
  interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
) {

  const { userLocale: locale, guild, guildId } = interactionOrMessage;
  const user = interactionOrMessage.member!.user;

  if (guild && !guild.members.me!.permissions.has(PermissionFlagsBits.AttachFiles))
    return await interactionOrMessage.reply({
      content: t("embed.no_attach_files_permission", { e, locale, perm: PermissionsTranslate.AttachFiles }),
      ephemeral: true,
    });

  const msg = await interactionOrMessage.reply({
    content: t("ban.list.loading", { e, locale }),
    fetchReply: true,
  });

  if (!guildsThatHasBeenFetched.has(guildId)) {
    guildsThatHasBeenFetched.add(guildId);
    await guild.bans.fetch().catch((error: Error) => error);
  }

  const bans = await guild.bans.fetch().catch(() => new Collection<string, GuildBan>());

  if (!bans.size)
    return await msg.edit({
      content: t("ban.list.no_users", { e, locale }),
    });

  const text =
    `-------------------- ${t("ban.list.script_title", locale)} --------------------
${t("ban.list.banned_users", { locale, bans })}
${t("ban.list.server", { locale, guild })}
${t("ban.list.date", { locale, date: new Date().toLocaleString(locale) })}
${t("ban.list.requester", { locale, user })}

${bans.map(ban => `${ban.user.username} (${ban.user.id})` + `${ban.reason ? `\n${ban.reason}` : ""}`).join("\n \n")}
`;

  const file = Buffer.from(text);
  const attachment = new AttachmentBuilder(file, { name: `${guild.name}.bans.txt`, description: "List with all banned used from this guild" });

  return await msg.edit({ content: null, files: [attachment] });
}