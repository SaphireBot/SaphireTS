import { Schema, InferSchemaType, Types } from "mongoose";

export const Connect4Schema = new Schema({
    id: String,
    players: [String],
    lines: [[String]],
    playNow: String,
    emojiPlayer: Object,
    history: Object
});

export type Connect4SchemaSchemaType = InferSchemaType<typeof Connect4Schema> & { _id: Types.ObjectId };