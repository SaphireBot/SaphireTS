import { ChatInputCommandInteraction, Message } from "discord.js";
import Database from "../../database";
import payloadServer from "./payload.server";

export default async function serverStatus(
  interaction: Message<true> | ChatInputCommandInteraction<"cached">,
) {

  const { guildId, userLocale: locale, guild, member } = interaction;

  if (interaction instanceof ChatInputCommandInteraction)
    await interaction.deferReply();

  const data = await Database.getGuild(guildId);

  const _payload = await payloadServer(data, locale, guild, member!);

  if (!_payload) {
    if (interaction instanceof ChatInputCommandInteraction)
      return await interaction.editReply({ content: "> No Data Available" });
    return await interaction.reply({ content: "> No Data Available" });
  }

  if (interaction instanceof ChatInputCommandInteraction)
    return await interaction.editReply(_payload);

  return await interaction.reply(_payload);

}