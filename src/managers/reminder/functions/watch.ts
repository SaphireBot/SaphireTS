import { ReminderManager } from "../..";
import { WatchChangeReminder } from "../../../@types/database";
import Database from "../../../database";
export const keys = new Map<string, string>();

export async function watch() {

    return Database.Reminders.watch()
        .on("change", async (change: WatchChangeReminder) => {

            if (change.operationType === "update") {
                const reminder = await ReminderManager.fetch(keys.get(change.documentKey._id.toString())!);
                if (reminder) ReminderManager.start(reminder);
                return;
            }

            if (change.operationType === "insert") {
                if ("userId" in change.fullDocument) {
                    ReminderManager.start(change.fullDocument);
                    return ReminderManager.emitRefresh(change.fullDocument.id, change.fullDocument.userId);
                }

            }

            if (change.operationType === "delete") {
                const key = keys.get(change.documentKey._id.toString());
                if (key) {
                    await ReminderManager.clear(key);
                    keys.delete(change.documentKey._id.toString());
                }
                return;
            }

            return console.log(change);
        });

}