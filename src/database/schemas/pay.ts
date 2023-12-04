import { Schema, InferSchemaType, Types } from "mongoose";

export const PaySchema = new Schema({
    messageId: { type: String },
    payer: { type: String },
    receiver: { type: String },
    value: { type: Number },
    guildId: { type: String },
    channelId: { type: String },
    expiresAt: { type: Date },
    confirm: {
        payer: { type: Boolean },
        receiver: { type: Boolean },
    }
});

export type PaySchemaType = InferSchemaType<typeof PaySchema> & { _id: Types.ObjectId };