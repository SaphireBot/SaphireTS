import { Schema, model, InferSchemaType, Types } from "mongoose";

const ReminderSchema = new Schema({
    id: { type: String, unique: true },
    userId: String,
    guildId: String,
    RemindMessage: String,
    Time: Number,
    isAutomatic: { type: Boolean, default: false },
    DateNow: Number,
    ChannelId: String,
    Alerted: { type: Boolean, default: false },
    sendToDM: { type: Boolean, default: false },
    interval: Number,
    messageId: String,
    disableComponents: Number,
    deleteAt: Number
});

export default model("Reminder", ReminderSchema);
export type ReminderSchema = InferSchemaType<typeof ReminderSchema> & { _id: Types.ObjectId };