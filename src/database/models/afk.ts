import { Schema, model, InferSchemaType, Types } from "mongoose";
const AfkSchema = new Schema({
    guildId: { type: String, default: "" },
    userId: String,
    message: { type: String, default: "" },
    type: String,
    deleteAt: Date
});

export default model("Afk", AfkSchema);
export type AfkSchema = InferSchemaType<typeof AfkSchema> & { _id: Types.ObjectId };