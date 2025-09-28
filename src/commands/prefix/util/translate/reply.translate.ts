import { ButtonStyle, ChatInputCommandInteraction, Message, MessageContextMenuCommandInteraction, MessageEditOptions, MessageReplyOptions, StringSelectMenuInteraction } from "discord.js";
import { e } from "../../../../util/json";
import { GlobalSystemNotificationManager } from "../../../../managers";
import client from "../../../../saphire";

export default async function reply(
  payload: MessageEditOptions | MessageReplyOptions | any,
  timeout: NodeJS.Timeout | undefined,
  msg: Message<true> | undefined,
  message: Message<true> | undefined,
  interaction?: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | StringSelectMenuInteraction,
) {
  clearTimeout(timeout);

  const userId = interaction?.user ? interaction.user.id : message?.author?.id;
  const channel = message?.channel || interaction?.channel;

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
  if (interaction) return await interaction.editReply(payload);

  if (message) {

    const webhook = await GlobalSystemNotificationManager.fetchWebhook(
      channel!,
      true,
      {
        reason: `${client.user!.username}'s Experience`,
      },
    );

    if (webhook && channel && "send" in channel)
      return GlobalSystemNotificationManager.sendMessage(
        {
          ...payload,
          username: `${client.user!.username}'s Translate System`,
        },
        channel,
      );

    return await message.reply(payload as MessageReplyOptions);
  };
}