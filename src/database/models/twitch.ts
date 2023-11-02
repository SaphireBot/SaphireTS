import { Schema, model, InferSchemaType, Types } from "mongoose";

const TwitchSchema = new Schema({
    streamer: String,
    /**
     *  channelId: String,
     *  guildId: String,
     *  message: String || undefined,
     *  roleId: String || undefined
     */
    notifiers: Object
});

export default model("Twitch", TwitchSchema);
export type TwitchSchema = InferSchemaType<typeof TwitchSchema> & { _id: Types.ObjectId };