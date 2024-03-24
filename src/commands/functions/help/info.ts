import { ChatInputCommandInteraction, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import getCommandEmbed from "./buildInfoEmbed";
import selectMenu from "./selectMenu";
import Database from "../../../database";

export default async function info(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction
) {

  const { userLocale: locale, user, guild } = interaction;

  let commandName: string | null | undefined;

  if (interaction instanceof StringSelectMenuInteraction)
    commandName = interaction.values[0];

  if (interaction instanceof ChatInputCommandInteraction)
    commandName = interaction.options.getString("command");

  if (!commandName)
    return await interaction.reply({
      content: t("help.no_commands", { e, locale }),
      ephemeral: true
    });

  const prefixes = await Database.getPrefix({ guildId: guild?.id, userId: user.id });
  const embeds = getCommandEmbed(commandName, locale, prefixes);

  let components: any[] = [];

  if (interaction instanceof StringSelectMenuInteraction) {
    const comps = interaction.message?.components;
    components = [
      comps[0].toJSON(),
      comps[1].toJSON()
    ];
  } else components = [selectMenu(locale, user.id)];

  return interaction instanceof ChatInputCommandInteraction
    ? await interaction.reply({ embeds, components })
    : await interaction.update({ embeds, components });

}