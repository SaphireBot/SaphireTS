import { Schema, InferSchemaType } from "mongoose";
import { Vote } from "../../@types/database";

export const VoteSchema = new Schema<Vote>({
  userId: String,
  messageId: String,
  channelId: String,
  guildId: String,
  messageUrl: String,
  deleteAt: Number,
  enableReminder: Boolean,
});

export type VoteSchemaType = InferSchemaType<typeof VoteSchema>;