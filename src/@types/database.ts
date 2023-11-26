import { Types } from "mongoose";
import { ReminderType } from "./commands";

export interface WatchChange {
    operationType: "update" | "insert" | "delete" | "invalidate" | "drop"
    documentKey: {
        _id: Types.ObjectId
    },
    _id: {
        _data: string
    },
    fullDocument: ReminderType | { id: string, reminderIdToRemove: string }
}