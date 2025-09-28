import { Schema, InferSchemaType, Types } from "mongoose";
import { BattleroyalePhraseType } from "../../@types/database";

export const BattleroyaleSchema = new Schema({
    id: String,
    username: String,
    kills: Number,
    matches: Number,
    deaths: Number,
    wins: Number,
});

export const BattleroyalePhraseSchema = new Schema<BattleroyalePhraseType>({
    user: String,
    kill: Boolean,
    phrase: String,
    approved: Boolean,
    locale: String,
});

export type BattleroyaleSchemaType = InferSchemaType<typeof BattleroyaleSchema> & { _id: Types.ObjectId };
export type BattleroyalePhraseSchemaType = InferSchemaType<typeof BattleroyalePhraseSchema> & { _id: Types.ObjectId };
