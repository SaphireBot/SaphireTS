import { Colors, ComponentType, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { ChannelsInGame, DiscordPermissons } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";
import payload from "./payload.server";
import Database from "../../database";

export default async function gamesServer(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, message, user, guildId } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_client_need_some_permissions");

  const channels = await guild.channels.fetch()?.then(cl => cl.clone())?.catch(() => null);

  if (!channels || !channels?.size || !ChannelsInGame?.size)
    return await interaction.reply({
      content: t("server.no_channels", { e, locale }),
      ephemeral: true,
    });

  let i = 0;
  for (const channel of channels.values()) {
    if (i >= 25) break;
    i++;
    if (channel?.id && !ChannelsInGame.has(channel.id))
      channels.delete(channel.id);
  }

  if (!channels?.size)
    return await interaction.reply({
      content: t("server.no_channels", { e, locale }),
      ephemeral: true,
    });

  const msg = await refreshGamesMessage("reply");

  return msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    componentType: ComponentType.StringSelect,
    idle: (1000 * 60) * 2,
  })
    .on("collect", async int => {

      const { values } = int;

      if (values.includes("cancel"))
        return await int.update({ components: [], embeds: [], content: "Canceled." });

      for (const channelId of values) {
        channels.delete(channelId);
        ChannelsInGame.delete(channelId);
      }

      if (!channels?.size)
        await int.update({ components: [], embeds: [], content: "Ok." });
      else await refreshGamesMessage("update", int);

      return await message.edit(
        await payload(await Database.getGuild(guildId), locale, guild, member),
      ).catch(() => { });

    })
    .on("end", async () => {
      await msg?.edit({ components: [], embeds: [], content: "Ok." })?.catch(() => { });
      await message.edit(
        await payload(await Database.getGuild(guildId), locale, guild, member),
      ).catch(() => { });
    });

  async function refreshGamesMessage(response: "reply" | "update" | "send", int?: StringSelectMenuInteraction) {
    const options = [
      channels!.map(ch => {
        if (!ch?.name) return;
        return {
          label: ch.name,
          emoji: "#️⃣",
          description: ((ch as any)?.topic || "No Topic").limit(50),
          value: ch.id,
        };
      })
        .filter(Boolean)
        .flat(),
      {
        label: t("keyword_cancel", locale),
        emoji: e.DenyX,
        description: t("help.selectmenu.options.4.description", locale),
        value: "cancel",
      },
    ]
      .flat();
    const payloadData = {
      ephemeral: true,
      embeds: [{
        color: Colors.Blue,
        title: t("server.embeds.title_games", { e, locale }),
        description: channels!.map(ch => `${ch}`).join("\n"),
        footer: {
          text: `♥️ ${client.user?.username}'s Guild Services`,
        },
      }],
      fetchReply: true,
      components: !member?.permissions?.has(PermissionFlagsBits.Administrator)
        ? []
        : [
          {
            type: 1,
            components: [{
              type: 3,
              custom_id: "ignore",
              placeholder: t("server.components.select_menu.active_channels", locale),
              max_values: options.length - 1,
              min_values: 1,
              options,
            }],
          },
        ] as any,
    };

    if (response === "reply") return await interaction.reply(payloadData);
    if (response === "update") return await int!.update(payloadData);
    return await interaction!.followUp(payloadData);
  }

  return;
}