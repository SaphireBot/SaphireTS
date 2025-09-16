import { Schema, InferSchemaType, Types } from "mongoose";
import { GiveawayType } from "../../@types/database";

export const GiveawaySchema = new Schema<GiveawayType>({
  MessageID: { type: String, unique: true },
  GuildId: String,
  Prize: String,
  Winners: Number,
  LauchDate: Number,
  WinnersGiveaway: [String],
  Participants: [String],
  Emoji: String,
  TimeMs: Number,
  DateNow: Number,
  ChannelId: String,
  Actived: Boolean,
  MessageLink: String,
  CreatedBy: String,
  Sponsor: String,
  AllowedRoles: [String],
  LockedRoles: [String],
  AllowedMembers: [String],
  LockedMembers: [String],
  RequiredAllRoles: Boolean,
  AddRoles: [String],
  MultipleJoinsRoles: [{ id: String, joins: Number }],
  MinAccountDays: Number,
  MinInServerDays: Number,
});

export type GiveawaySchemaType = InferSchemaType<typeof GiveawaySchema> & { _id: Types.ObjectId };