import { Schema, InferSchemaType, Types } from "mongoose";

export const CrashSchema = new Schema({
    messageId: { type: String },
    guildId: { type: String },
    channelId: { type: String },
    value: { type: Number },
    players: [String]
});

export type CrashSchemaType = InferSchemaType<typeof CrashSchema> & { _id: Types.ObjectId };