import { APIEmbed, APIEmbedField, AuditLogEvent, Colors, GuildMember, PartialGuildMember, PermissionsBitField } from "discord.js";
import Database from "../../database";
import { e } from "../../util/json";
import { t } from "../../translator";
import client from "../../saphire";
import { Config } from "../../util/constants";
import { GSNManager } from "../../managers";
const alreadyLogged = new Set<string>();

export default async function kickLogs(member: GuildMember | PartialGuildMember) {

  const { guild, user } = member;

  if (
    !guild.members.me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)
    || !guild.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)
  ) return await disable(guild.id, "active", "No permissions - Visualizar Audit Logs | Enviar Mensagens");

  const data = await Database.getGuild(guild.id);
  const { active, channelId } = data?.Logs?.kick || {};
  if (!active || !channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !("send" in channel)) return await disable(guild.id, "channelId");

  const log = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick })
    .then(res => res.entries.first())
    .catch(() => null);
  if (!log || !log.executor?.id || alreadyLogged.has(log.id) || log.targetId !== user.id) return;

  let locale = guild.preferredLocale;
  if (!Config.locales.includes(locale)) locale = client.defaultLocale as any;

  const fields: APIEmbedField[] = [];

  if (log.reason?.length)
    fields.push({
      name: t("logs.kick.embed.field", locale),
      value: log.reason.limit("EmbedFieldValue"),
    });

  const embed: APIEmbed = {
    color: Colors.Blue,
    author: {
      icon_url: user.displayAvatarURL() || undefined,
      name: t("logs.kick.embed.author", { user, locale }),
    },
    description: `${t("logs.kick.embed.description", { locale, executor: log.executor, e })}\n👤 ${user.username} \`${user.id}\``,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: guild.name,
      icon_url: guild.iconURL() || undefined,
    },
  };

  alreadyLogged.add(log.id);

  return GSNManager
    .setPayloadToSendWithWebhook(
      channel,
      { embeds: [embed] },
    );

}

async function disable(guildId: string, finalPath: "channelId" | "active", messageWarn?: string) {
  await Database.Guilds.updateOne(
    { id: guildId },
    { $unset: { [`Logs.kick.${finalPath}`]: true } },
    { upsert: true },
  );

  if (messageWarn)
    return; // LOGS GSN CHANNEL
}