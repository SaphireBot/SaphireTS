import { Schema, model, InferSchemaType, Types } from "mongoose";

const Pay = new Schema({
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

export default model("Pay", Pay);
export type PaySchema = InferSchemaType<typeof Pay> & { _id: Types.ObjectId };