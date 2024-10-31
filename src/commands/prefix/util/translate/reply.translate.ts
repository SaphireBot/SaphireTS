import { ChatInputCommandInteraction, Message, MessageContextMenuCommandInteraction, MessageEditOptions, MessageReplyOptions } from "discord.js";

export default async function reply(
  payload: MessageEditOptions | MessageReplyOptions,
  timeout: NodeJS.Timeout | undefined,
  msg: Message<true> | undefined,
  message: Message<true> | undefined,
  interaction?: ChatInputCommandInteraction | MessageContextMenuCommandInteraction,
) {
  clearTimeout(timeout);
  if (msg) return await msg.edit(payload as MessageEditOptions).catch(console.log);
  if (message) return await message.reply(payload as MessageReplyOptions);
  if (interaction) return await interaction.editReply(payload);
}