import { ChatInputCommandInteraction, Message } from "discord.js";

export default async function reply(interaction: ChatInputCommandInteraction | Message, payload: any): Promise<Message | void> {
  if (interaction instanceof ChatInputCommandInteraction)
    return await interaction.editReply(payload)
      .catch(() => { });

  return await interaction.reply(payload).catch(() => { });
}