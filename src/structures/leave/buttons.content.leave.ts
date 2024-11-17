import { ButtonInteraction, ButtonStyle, parseEmoji, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import modals from "../modals";
import Database from "../../database";
import configLeave from "./config.leave";
import { mapButtons } from "djs-protofy";
import { e } from "../../util/json";
import { LeaveCacheContent } from "./payload.leave";
import viewLeave from "./view.leave";

export default async function buttonsContentLeave(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "leave_content", uid: string, src: "save" | "edit" | "delete" | "back" | "home" | "view" },
) {

  const { guild, member, userLocale: locale, message, guildId, customId, user } = interaction;

  if (customData?.uid !== member.id) return;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const content = LeaveCacheContent.get(user.id) || (await Database.getGuild(guildId))?.LeaveNotification?.body?.content;

  if (!LeaveCacheContent.has(user.id) && content)
    LeaveCacheContent.set(user.id, content);

  if (customData?.src === "view")
    return await viewLeave(interaction);

  if (customData?.src === "edit")
    return await interaction.showModal(modals.leave.content(locale, content || ""));

  if (["back", "home"].includes(customData?.src)) {
    LeaveCacheContent.delete(user.id);
    return await configLeave(interaction, "update");
  }

  if (customData?.src === "delete") {

    await interaction.update({ components: loadingButtons() });

    LeaveCacheContent.delete(user.id);
    await Database.Guilds.updateOne(
      { id: guildId },
      {
        $unset: { "LeaveNotification.body.content": true },
      },
      { upsert: true },
    );

    await sleep(1500);
    return await configLeave(interaction, "editReply");
  }

  if (customData?.src === "save") {

    await interaction.update({ components: loadingButtons() });

    LeaveCacheContent.delete(user.id);
    await Database.Guilds.updateOne(
      { id: guildId },
      content
        ? { $set: { "LeaveNotification.body.content": content } }
        : { $unset: { "LeaveNotification.body.content": true } },
      { upsert: true },
    );

    await sleep(1500);
    await interaction.editReply({ components: loadingButtons(e.CheckV) });
    await sleep(1500);
    return await configLeave(interaction, "editReply");
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