import { Types } from "mongoose";

export interface WatchChange {
    operationType: "update" | "insert" | "delete"
    documentKey: {
        _id: Types.ObjectId
    }
}