import { Colors, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import Database from "../../database";
import handler from "../commands/handler";
import { PearlsManager } from "../../managers";
const permissions = [DiscordPermissons.ManageChannels, DiscordPermissons.ManageMessages];

export default async function pearlsServer(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, message, guildId, user } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageRoles, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageRoles, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_client_need_some_permissions");

  const prefix = (await Database.getPrefix({ guildId, userId: user.id })).random()!;
  const cmd = t("pearl.pearl", locale);
  const slash = handler.getApplicationCommand("pearl")?.getMention("config");
  const data = PearlsManager.get(guildId);

  await interaction.reply({
    embeds: [{
      color: Colors.Blue,
      title: t("pearl.embed.title", { e, locale }),
      description: t("pearl.embed.description", { e, locale }),
      fields: [
        {
          name: t("pearl.embed.fields.0.name", { e, locale }),
          value: permissions.map(perm => `${t(`Discord.Permissions.${perm}`, locale)}`).join(", "),
        },
        {
          name: t("pearl.embed.fields.1.name", { locale }),
          value: t("pearl.embed.fields.1.value", { e, locale, min: PearlsManager.min, max: PearlsManager.max }),
        },
        {
          name: t("pearl.embed.fields.2.name", { locale }),
          value: t("pearl.embed.fields.2.value", { e, locale, prefix, cmd, slash }),
        },
        {
          name: t("pearl.embed.fields.3.name", { locale }),
          value: data
            ? (() => {
              let str = "";

              str += `${data.emoji} ${t("pearl.reactions", { num: data.limit || 0, locale })}\n`;
              str += `📨 ${guild.channels.cache.get(data.channelId)}\n`;
              str += `⭐ ${t("pearl.total", {
                total: Object.values(PearlsManager.count[guild.id] || {}).reduce((pre, curr) => pre + curr, 0).currency(),
                locale,
              })}`;

              return str;
            })()
            : `${e.DenyX} ${t("keyword_disable", locale)}`,
        },
        {
          name: t("pearl.embed.fields.4.name", { e, locale }),
          value: t("pearl.embed.fields.4.value", { e, locale, prefix, cmd, slash, channel: guild.channels.cache.random()! }),
        },
      ],
    }],
    ephemeral: true,
  });

  await sleep(1000);
  return await interaction.followUp({
    content: t("server.you_need_refresh", { e, locale }),
    ephemeral: true,
  });
}