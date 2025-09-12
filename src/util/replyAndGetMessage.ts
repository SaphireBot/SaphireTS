import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Message,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  UserSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  StringSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  InteractionReplyOptions,
  MessagePayload,
  MessageReplyOptions,
} from "discord.js";

export default async function replyAndGetMessage(
  messageOrInteraction: Message<boolean>
    | ChatInputCommandInteraction<"cached">
    | ButtonInteraction<"cached">
    | ModalSubmitInteraction<"cached">

    // Select Menus
    | RoleSelectMenuInteraction<"cached">
    | UserSelectMenuInteraction<"cached">
    | StringSelectMenuInteraction<"cached">
    | ChannelSelectMenuInteraction<"cached">
    | MentionableSelectMenuInteraction<"cached">,

  payload: MessagePayload | MessageReplyOptions | InteractionReplyOptions,
): Promise<Message<boolean> | undefined | null> {

  if (
    messageOrInteraction instanceof Message
    && (
      payload instanceof MessagePayload
      || isMessageReplyOptions(payload as MessageReplyOptions)
    )
  )
    return await messageOrInteraction.reply(payload as any);

  if (
    messageOrInteraction instanceof ChatInputCommandInteraction
    || messageOrInteraction instanceof RoleSelectMenuInteraction
    || messageOrInteraction instanceof ButtonInteraction
    || messageOrInteraction instanceof ModalSubmitInteraction
    || messageOrInteraction instanceof UserSelectMenuInteraction
    || messageOrInteraction instanceof StringSelectMenuInteraction
    || messageOrInteraction instanceof ChannelSelectMenuInteraction
    || messageOrInteraction instanceof MentionableSelectMenuInteraction
    && (
      isMessageReplyOptions(payload as MessageReplyOptions)
      || isInteractionReplyOptions(payload as InteractionReplyOptions)
    )
  )
    return await messageOrInteraction.reply(
      Object.assign(payload as any, { withResponse: true }),
    )
      .then(res => res.resource?.message);

  return undefined;
}

function isMessageReplyOptions(payload: MessageReplyOptions): payload is MessageReplyOptions {
  if (!payload || typeof payload !== "object") return false;

  return !!(
    payload.allowedMentions
    || payload.content
    || payload.embeds
    || payload.files
    || payload.components
    || payload.stickers
    || payload.flags
    || payload.tts
    || payload.nonce
    || payload.embeds
  );
}

function isInteractionReplyOptions(payload: InteractionReplyOptions): payload is InteractionReplyOptions {
  if (!payload || typeof payload !== "object") return false;

  return !!(
    payload.allowedMentions
    || payload.content
    || payload.embeds
    || payload.files
    || payload.components
    || payload.withResponse
    || payload.flags
    || payload.tts
    || payload.poll
    || payload.embeds
  );
}
