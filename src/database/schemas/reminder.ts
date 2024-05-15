import { Schema, InferSchemaType, Types } from "mongoose";

export const ReminderSchema = new Schema({
    id: { type: String, unique: true, required: true },
    userId: { type: String, required: true },
    guildId: String,
    message: { type: String, required: true },
    lauchAt: { type: Date, required: true },
    isAutomatic: { type: Boolean, default: false },
    channelId: String,
    alerted: { type: Boolean, default: false },
    sendToDM: { type: Boolean, default: false },
    interval: Number,
    messageId: String,
    disableComponents: Date,
    deleteAt: Date,
    createdAt: { type: Date, default: new Date() }
});

export type ReminderSchemaType = InferSchemaType<typeof ReminderSchema> & { _id: Types.ObjectId };