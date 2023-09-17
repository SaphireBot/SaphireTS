import { Schema, model, InferSchemaType, Types } from "mongoose";

const BlacklistSchema = new Schema({
    id: { type: String, unique: true },
    type: { type: String }, // user | guild | economy
    removeIn: { type: Date, default: null },
    addedAt: { type: Date },
    staff: { type: String },
    reason: { type: String }
});

export default model("Blacklist", BlacklistSchema);
export type BlacklistSchema = InferSchemaType<typeof BlacklistSchema> & { _id: Types.ObjectId };