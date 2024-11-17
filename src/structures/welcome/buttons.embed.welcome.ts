import { ButtonInteraction, ButtonStyle, parseEmoji, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import modals from "../modals";
import Database from "../../database";
import configWelcome from "./config.welcome";
import { mapButtons } from "djs-protofy";
import { e } from "../../util/json";
import { t } from "../../translator";
import viewWelcome from "./view.welcome";
import { WelcomeCacheEmbed } from "./payload.welcome";

export default async function buttonsEmbedWelcome(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "welcome_embed", uid: string, src: "save" | "edit" | "delete" | "back" | "home" | "view" },
) {

  const { guild, member, userLocale: locale, message, guildId, customId, user } = interaction;

  if (customData?.uid !== member.id) return;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const embed = WelcomeCacheEmbed.get(user.id) || (await Database.getGuild(guildId))?.WelcomeNotification?.body?.embed || message.embeds?.[0]?.toJSON() || {};

  if (customData?.src === "view")
    return await viewWelcome(interaction);

  if (customData?.src === "edit")
    return await interaction.showModal(modals.welcome.embed(locale, JSON.stringify(embed, null, 4)));

  if (["back", "home"].includes(customData?.src)) {
    WelcomeCacheEmbed.delete(user.id);
    return await configWelcome(interaction, "update");
  }

  if (customData?.src === "delete") {

    await interaction.update({ components: loadingButtons() });

    WelcomeCacheEmbed.delete(member.id);
    await Database.Guilds.updateOne(
      { id: guildId },
      { $unset: { "WelcomeNotification.body.embed": true } },
      { upsert: true },
    );

    await sleep(1500);
    return await configWelcome(interaction, "editReply");
  }

  if (customData?.src === "save") {

    if (
      !embed.author
      && !embed.description
      && !embed.title
      && !embed.image?.url
      && !embed.footer?.text
    )
      return await interaction.followUp({
        content: t("welcome.content.empty_embed", { e, locale, err: "Empty Embed Content" }),
        ephemeral: true,
      });

    await interaction.update({ components: loadingButtons() });

    WelcomeCacheEmbed.delete(user.id);
    await Database.Guilds.updateOne(
      { id: guildId },
      { $set: { "WelcomeNotification.body.embed": embed } },
      { upsert: true },
    );

    await sleep(1500);
    await interaction.editReply({ components: loadingButtons(e.CheckV) });
    await sleep(1500);
    return await configWelcome(interaction, "editReply");
  }

  function loadingButtons(emoji?: string) {
    return mapButtons(message.components, button => {
      if (
        button.style === ButtonStyle.Link
        || button.style === ButtonStyle.Premium
      ) return button;

      if (button.custom_id === customId)
        button.emoji = parseEmoji(emoji || e.Loading)!;

      button.disabled = true;
      return button;
    });
  }

}