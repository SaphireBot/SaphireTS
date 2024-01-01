import { Schema, InferSchemaType, Types } from "mongoose";

export const JokempoSchema = new Schema({
    messageId: { type: String, default: "" },
    id: { type: String, default: "" },
    createdBy: { type: String },
    opponentId: { type: String },
    value: { type: Number },
    guildId: { type: String },
    channelOrigin: { type: String, default: "" },
    channelId: { type: String },
    expiresAt: { type: Date },
    clicks: Object,
    global: { type: Boolean, default: false },
    webhookUrl: { type: String, default: "" }
});

export type JokempoSchemaType = InferSchemaType<typeof JokempoSchema> & { _id: Types.ObjectId };