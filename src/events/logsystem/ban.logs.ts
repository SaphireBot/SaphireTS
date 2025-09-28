import {
  APIEmbedField,
  AuditLogEvent,
  ButtonStyle,
  Colors,
  GuildBan,
  parseEmoji,
  PermissionsBitField,
} from "discord.js";
import Database from "../../database";
import { e } from "../../util/json";
import { t } from "../../translator";
import client from "../../saphire";
import { Config } from "../../util/constants";
import { GlobalSystemNotificationManager } from "../../managers";
const alreadyLogged = new Set<string>();

export default async function banLogs(guildBan: GuildBan) {

  const { guild, user } = guildBan;

  if (
    !guild.members.me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)
    || !guild.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)
  ) return await disable(guild.id, "ban", "No permissions - Visualizar Audit Logs | Enviar Mensagens");

  const data = await Database.getGuild(guild.id);
  const { ban, active, channelId } = data?.Logs?.ban || {};
  if (!ban || !channelId || !active) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !("send" in channel)) return await disable(guild.id, "channelId");

  const log = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })
    .then(res => res.entries.first())
    .catch(() => null);

  if (!log || !log.executor?.id || alreadyLogged.has(log.id) || log.targetId !== user.id) return;

  let locale = guild.preferredLocale;
  if (!Config.locales.includes(locale)) locale = client.defaultLocale as any;

  const fields: APIEmbedField[] = [];

  if (log.reason?.length)
    fields.push({
      name: t("logs.ban.embed.field", locale),
      value: log.reason.limit("EmbedFieldValue"),
    });

  alreadyLogged.add(log.id);

  const payload = {
    content: `-# ${user.username} - ID: ${user.id}`,
    embeds: [{
      color: Colors.Blue,
      author: {
        icon_url: user.displayAvatarURL() || undefined,
        name: t("logs.ban.embed.author_ban", { user, locale }),
      },
      description: t("logs.ban.embed.description", { locale, executor: log.executor, e }),
      fields,
      timestamp: new Date().toISOString(),
    }],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("logs.ban.unban", locale),
            custom_id: JSON.stringify({ c: "unban", userId: user.id }),
            style: ButtonStyle.Primary,
            emoji: parseEmoji(e.ModShield)!,
          },
        ],
      },
    ],
  };

  return await GlobalSystemNotificationManager.setPayloadToSendWithClient(channel, payload);

}

async function disable(guildId: string, finalPath: "channelId" | "ban", messageWarn?: string) {
  await Database.Guilds.updateOne(
    { id: guildId },
    { $unset: { [`Logs.ban.${finalPath}`]: true } },
    { upsert: true },
  );

  if (messageWarn)
    return; // LOGS GSN CHANNEL
}
