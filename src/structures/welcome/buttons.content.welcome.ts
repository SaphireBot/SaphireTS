import { ButtonInteraction, ButtonStyle, parseEmoji, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import modals from "../modals";
import Database from "../../database";
import configWelcome from "./config.welcome";
import { mapButtons } from "djs-protofy";
import { e } from "../../util/json";
import { WelcomeCacheContent } from "./payload.welcome";
import viewWelcome from "./view.welcome";

export default async function buttonsContentWelcome(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "welcome_content", uid: string, src: "save" | "edit" | "delete" | "back" | "home" | "view" },
) {

  const { guild, member, userLocale: locale, message, guildId, customId, user } = interaction;

  if (customData?.uid !== member.id) return;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const content = WelcomeCacheContent.get(user.id) || (await Database.getGuild(guildId))?.WelcomeNotification?.body?.content;

  if (!WelcomeCacheContent.has(user.id) && content)
    WelcomeCacheContent.set(user.id, content);

  if (customData?.src === "view")
    return await viewWelcome(interaction);

  if (customData?.src === "edit")
    return await interaction.showModal(modals.welcome.content(locale, content || ""));

  if (["back", "home"].includes(customData?.src)) {
    WelcomeCacheContent.delete(user.id);
    return await configWelcome(interaction, "update");
  }

  if (customData?.src === "delete") {

    await interaction.update({ components: loadingButtons() });

    WelcomeCacheContent.delete(user.id);
    await Database.Guilds.updateOne(
      { id: guildId },
      {
        $unset: { "WelcomeNotification.body.content": true },
      },
      { upsert: true },
    );

    await sleep(1500);
    return await configWelcome(interaction, "editReply");
  }

  if (customData?.src === "save") {

    await interaction.update({ components: loadingButtons() });

    WelcomeCacheContent.delete(user.id);
    await Database.Guilds.updateOne(
      { id: guildId },
      content
        ? { $set: { "WelcomeNotification.body.content": content } }
        : { $unset: { "WelcomeNotification.body.content": true } },
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