import { Schema, model, InferSchemaType, Types } from "mongoose";

const Command = new Schema({
    id: String,
    count: Number,
    usage: Object
});

export default model("Commands", Command);
export type CommandSchema = InferSchemaType<typeof Command> & { _id: Types.ObjectId };