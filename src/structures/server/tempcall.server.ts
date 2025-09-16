import { StringSelectMenuInteraction, PermissionFlagsBits, ButtonStyle, ComponentType, MessageFlags } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import { GuildSchemaType } from "../../database/schemas/guild";
import payloadServer from "./payload.server";

export default async function tempcallServer(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, guildId, message, user } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_client_need_some_permissions");

  let data = await Database.getGuild(guildId);

  const intResponse = await interaction.reply({
    content: t("server.tempcall.switch_fast", { e, locale }),
    components: getButtons(data),
    flags: [MessageFlags.Ephemeral],
    withResponse: true,
  }).then(res => res.resource?.message);

  await sleep(1000);
  await message.edit({ components: message.components });

  return intResponse?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: int => int.user.id === user.id,
    idle: (1000 * 60) * 2,
  })
    .on("collect", async int => {
      const { customId } = int;

      if (customId === "cancel")
        return await int.update({ components: [] });

      if (customId === "switch") {
        data = await Database.Guilds.findOneAndUpdate(
          { id: guildId },
          { $set: { "TempCall.enable": !data?.TempCall?.enable } },
          { new: true, upsert: true },
        );
        await int.update({ components: getButtons(data) });
        return await refresh(data);
      }

      if (customId === "muted") {
        data = await Database.Guilds.findOneAndUpdate(
          { id: guildId },
          { $set: { "TempCall.muteTime": !data?.TempCall?.muteTime } },
          { new: true, upsert: true },
        );
        await int.update({ components: getButtons(data) });
        return await refresh(data);
      }

    });

  async function refresh(data: GuildSchemaType | undefined) {
    return await message.edit(await payloadServer(data, locale, guild, member)).catch(() => { });
  }

  function getButtons(data: GuildSchemaType | undefined) {
    return [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: data?.TempCall?.enable ? t("keyword_enable", locale) : t("keyword_disable", locale),
            emoji: data?.TempCall?.enable ? e.CheckV : e.DenyX,
            custom_id: "switch",
            style: data?.TempCall?.enable ? ButtonStyle.Success : ButtonStyle.Secondary,
          },
          {
            type: 2,
            label: data?.TempCall?.muteTime ? t("tempcall.save_muted_time", locale) : t("tempcall.ignore_muted_time", locale),
            emoji: data?.TempCall?.muteTime ? e.CheckV : e.DenyX,
            custom_id: "muted",
            style: data?.TempCall?.muteTime ? ButtonStyle.Success : ButtonStyle.Secondary,
            disabled: !data?.TempCall?.enable,
          },
          {
            type: 2,
            label: t("keyword_cancel", locale),
            emoji: e.Trash,
            custom_id: "cancel",
            style: ButtonStyle.Danger,
          },
        ],
      },
    ].asMessageComponents();
  }
}