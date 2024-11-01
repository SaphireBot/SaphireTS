import { ButtonStyle, ChatInputCommandInteraction, Message, MessageContextMenuCommandInteraction, MessageEditOptions, MessageReplyOptions, StringSelectMenuInteraction } from "discord.js";
import { e } from "../../../../util/json";

export default async function reply(
  payload: MessageEditOptions | MessageReplyOptions,
  timeout: NodeJS.Timeout | undefined,
  msg: Message<true> | undefined,
  message: Message<true> | undefined,
  interaction?: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | StringSelectMenuInteraction,
) {
  clearTimeout(timeout);

  const userId = interaction?.user ? interaction.user.id : message?.author?.id;

  if (userId)
    payload.components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            emoji: e.Trash,
            custom_id: JSON.stringify({ c: "delete", uid: userId }),
            style: ButtonStyle.Danger,
          },
        ] as any[],
      },
    ];

  if (msg) return await msg.edit(payload as MessageEditOptions).catch(console.log);
  if (message) return await message.reply(payload as MessageReplyOptions);
  if (interaction) return await interaction.editReply(payload);
}