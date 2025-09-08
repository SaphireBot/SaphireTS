import { ButtonInteraction, MessageFlags, StringSelectMenuInteraction } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import payloadLeave from "./payload.leave";

export default async function viewLeave(
  interaction: StringSelectMenuInteraction<"cached"> | ButtonInteraction<"cached">,
) {

  const { guildId, userLocale: locale, member } = interaction;
  const data = await Database.getGuild(guildId);
  const { content, embeds } = payloadLeave(data, member);

  if (!content?.length && !embeds.length)
    return await interaction.reply({
      content: t("leave.content.no_content", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  return await interaction.reply({ content, embeds, flags: [MessageFlags.Ephemeral] });

}