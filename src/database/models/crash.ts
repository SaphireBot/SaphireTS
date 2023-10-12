import { Schema, model, InferSchemaType, Types } from "mongoose";

const CrashSchema = new Schema({
    messageId: { type: String },
    guildId: { type: String },
    channelId: { type: String },
    value: { type: Number },
    players: [String]
});

export default model("Crash", CrashSchema);
export type CrashSchema = InferSchemaType<typeof CrashSchema> & { _id: Types.ObjectId };