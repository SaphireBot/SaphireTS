import { Schema, InferSchemaType, Types } from "mongoose";

export const BattleroyaleSchema = new Schema({
    id: String,
    username: String,
    kills: Number,
    matches: Number,
    deaths: Number,
    wins: Number
});

export type BattleroyaleSchemaSchemaType = InferSchemaType<typeof BattleroyaleSchema> & { _id: Types.ObjectId };