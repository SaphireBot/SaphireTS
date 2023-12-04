import { Schema, InferSchemaType, Types } from "mongoose";

export const JokempoSchema = new Schema({
    messageId: { type: String },
    createdBy: { type: String },
    opponentId: { type: String },
    value: { type: Number },
    guildId: { type: String },
    channelId: { type: String },
    expiresAt: { type: Date },
    clicks: Object
});

export type JokempoSchemaType = InferSchemaType<typeof JokempoSchema> & { _id: Types.ObjectId };