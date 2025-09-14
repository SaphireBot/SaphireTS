import { NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, VoiceChannel, type APIAttachment, type APIEmbed, type Attachment, type AttachmentBuilder, type AttachmentPayload, type BufferResolvable, type JSONEncodable } from "discord.js";
import type Stream from "stream";

export interface LogSystemPayload {
  embeds?: DiscordEmbedPayload[]
  files?: DiscordFilePayload[]
}

type DiscordEmbedPayload = JSONEncodable<APIEmbed> | APIEmbed

type DiscordFilePayload =
  | BufferResolvable
  | Stream
  | JSONEncodable<APIAttachment>
  | Attachment
  | AttachmentBuilder
  | AttachmentPayload


export type channelType = NewsChannel | StageChannel | TextChannel | PublicThreadChannel<boolean> | PrivateThreadChannel | VoiceChannel;