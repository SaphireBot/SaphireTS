import { ButtonInteraction, ButtonStyle, ChannelType, parseEmoji, PermissionFlagsBits, MessageFlags } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import Database from "../../database";
import { e } from "../../util/json";
import { t } from "../../translator";
import payloadWelcome from "./payload.welcome";
import { mapButtons } from "djs-protofy";
import lauchWelcome from "./lauch.welcome";
import disableWelcomeChannel from "./disableChannel.welcome";

export default async function buttonsChannelWelcome(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "welcome_channel", uid: string, src: "delete" | "back" | "send" },
) {

  const { guild, member, userLocale: locale, message, guildId, user, customId } = interaction;

  if (customData?.uid !== member.id) return;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);
  let channelId = data?.WelcomeNotification?.channelId;
  let channel = (channelId ? await guild.channels.fetch(channelId).catch(() => undefined) : undefined);

  if (customData?.src === "delete") {
    await disableWelcomeChannel(guildId);
    channel = undefined;
    channelId = undefined;
    return await interaction.update(payload());
  }

  if (customData?.src === "send") {
    await interaction.update({ components: loadingButtons() });

    if (!channel || !("send" in channel)) {
      await disableWelcomeChannel(guildId);
      channel = undefined;
      channelId = undefined;
      await sleep(2000);
      return await interaction.editReply(payload("fail"));
    }

    return await channel.send(payloadWelcome(data, member))
      .then(async () => await interaction.editReply(payload("success")))
      .catch(async err => {
        await disableWelcomeChannel(guildId);
        await sleep(2000);
        await interaction.editReply(payload("fail"));
        await sleep(1500);
        return await interaction.followUp({
          content: t("twitch.error", { e, locale, err }),
          flags: [MessageFlags.Ephemeral],
        });
      });
  }

  if (["back", "home"].includes(customData?.src))
    return await lauchWelcome(interaction, "update");

  function payload(sended?: "success" | "fail") {

    const content = data?.WelcomeNotification?.body?.content;
    let embed = data?.WelcomeNotification?.body?.embed;

    if (
      !embed?.author
      && !embed?.description
      && !embed?.title
      && !embed?.image?.url
      && !embed?.footer?.text
    ) embed = undefined;

    return {
      content: t("welcome.content.choose_channel", { e, locale, channel: channel || t("welcome.content.no_channel", locale) }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("welcome.components.buttons.back", locale),
              custom_id: JSON.stringify({ c: "welcome_channel", uid: member.id, src: "back" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("⏮️")!,
            },
            {
              type: 2,
              label: sended === "success"
                ? t("welcome.components.buttons.send_success", locale)
                : sended === "fail"
                  ? t("welcome.components.buttons.send_fail", locale)
                  : t("welcome.components.buttons.send", locale),
              custom_id: JSON.stringify({ c: "welcome_channel", uid: member.id, src: "send" }),
              style: sended === "success"
                ? ButtonStyle.Success
                : sended === "fail"
                  ? ButtonStyle.Danger
                  : ButtonStyle.Primary,
              emoji: sended === "success"
                ? parseEmoji(e.CheckV)!
                : sended === "fail"
                  ? parseEmoji(e.bug)!
                  : parseEmoji("📨")!,
              disabled: sended
                ? true
                : (channel && (content || embed))
                  ? false
                  : true,
            },
            {
              type: 2,
              label: t("welcome.components.buttons.delete", locale),
              custom_id: JSON.stringify({ c: "welcome_channel", uid: member.id, src: "delete" }),
              style: ButtonStyle.Danger,
              emoji: parseEmoji(e.Trash)!,
              disabled: channel ? false : true,
            },
          ],
        },
        {
          type: 1,
          components: [{
            type: 8,
            custom_id: JSON.stringify({ c: "welcome", src: "channel", uid: user.id }),
            placeholder: t("embed.components.select_menu.config.choose_channel_placeholder", locale),
            channel_types: [
              ChannelType.GuildAnnouncement,
              ChannelType.GuildText,
            ],
          }],
        },
      ],
    };
  }

  function loadingButtons() {
    return mapButtons(message.components, button => {
      if (
        button.style === ButtonStyle.Link
        || button.style === ButtonStyle.Premium
      ) return button;

      if (button.custom_id === customId)
        button.emoji = parseEmoji(e.Loading)!;

      button.disabled = true;
      return button;
    });
  }
}