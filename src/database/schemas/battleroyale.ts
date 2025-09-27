import { Schema, InferSchemaType, Types } from "mongoose";

export const BattleroyaleSchema = new Schema({
    id: String,
    username: String,
    kills: Number,
    matches: Number,
    deaths: Number,
    wins: Number
});

export const BattleroyalePhraseSchema = new Schema({
    user: String,
    players: Number, // 1 | 2 | 3 players
    kill: Boolean,
    phrase: String,
    approved: Boolean
});

export type BattleroyaleSchemaSchemaType = InferSchemaType<typeof BattleroyaleSchema> & { _id: Types.ObjectId };
export type BattleroyalePhraseSchemaType = InferSchemaType<typeof BattleroyalePhraseSchema> & { _id: Types.ObjectId };
