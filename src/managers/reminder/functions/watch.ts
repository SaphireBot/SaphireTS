import { ReminderManager } from "../..";
import { WatchChange } from "../../../@types/database";
import Database from "../../../database";
export const keys = new Map<string, string>();

export async function watch() {

    return Database.Reminders.watch()
        .on("change", (change: WatchChange) => {

            if (change.operationType === "update") return;

            if (change.operationType === "insert") {

                if ("userId" in change.fullDocument)
                    return ReminderManager.emitRefresh(change.fullDocument.id, change.fullDocument.userId);

                if ("reminderIdToRemove" in change.fullDocument) {
                    const reminderId = change.fullDocument.reminderIdToRemove;
                    if (reminderId) return ReminderManager.clear(reminderId);
                    return;
                }
            }

            if (change.operationType === "delete") {
                const key = keys.get(change.documentKey._id.toString());
                if (key) ReminderManager.clear(key);
                return;
            }

            return console.log(change);
        });

}