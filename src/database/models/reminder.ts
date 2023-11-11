import { Schema, model, InferSchemaType, Types } from "mongoose";

const ReminderSchema = new Schema({
    id: { type: String, unique: true },
    userId: String,
    guildId: String,
    message: String,
    lauchAt: Date,
    isAutomatic: { type: Boolean, default: false },
    createdAt: Date,
    channelId: String,
    alerted: { type: Boolean, default: false },
    sendToDM: { type: Boolean, default: false },
    interval: Number,
    messageId: String,
    disableComponents: Date,
    deleteAt: Date,
    reminderIdToRemove: String
});

export default model("Reminder", ReminderSchema);
export type ReminderSchema = InferSchemaType<typeof ReminderSchema> & { _id: Types.ObjectId };