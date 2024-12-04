import { ButtonInteraction, ChatInputCommandInteraction, Message, StringSelectMenuInteraction } from "discord.js";

export default async function reply(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | ButtonInteraction | Message,
  msg: Message | undefined,
  payload: any,
) {

  if (
    interaction instanceof ChatInputCommandInteraction
    || interaction instanceof StringSelectMenuInteraction
    || interaction instanceof ButtonInteraction
  ) {
    payload.fetchReply = true;
    return await interaction.editReply(payload);
  }

  if (interaction instanceof Message) {
    if (msg) return await msg.edit(payload);
    return await interaction.reply(payload);
  }
}