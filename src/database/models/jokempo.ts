import { Schema, model, InferSchemaType, Types } from "mongoose";

const Jokempo = new Schema({
    messageId: { type: String },
    createdBy: { type: String },
    opponentId: { type: String },
    value: { type: Number },
    guildId: { type: String },
    channelId: { type: String },
    expiresAt: { type: Date },
    clicks: Object
});

export default model("Jokempo", Jokempo);
export type JokempoSchema = InferSchemaType<typeof Jokempo> & { _id: Types.ObjectId };