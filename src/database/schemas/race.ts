import { Schema, InferSchemaType, Types } from "mongoose";

export const RaceSchema = new Schema({
    id: String,
    value: Number,
    userId: String,
    guildId: String,
    translateRefundKey: String
});

export type RaceSchemaType = InferSchemaType<typeof RaceSchema> & { _id: Types.ObjectId };