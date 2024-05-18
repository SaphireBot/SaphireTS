import { ReminderManager } from "../..";
import { WatchChangeReminder } from "../../../@types/database";
import Database from "../../../database";
import { ReminderSchemaType } from "../../../database/schemas/reminder";
export const keys = new Map<string, string>();

export async function watch() {

    return Database.Reminders.watch()
        .on("change", async (change: WatchChangeReminder) => {

            if (change.operationType === "update") {
                const reminder = await Database.Reminders.findById(change.documentKey._id);
                if (reminder) {
                    keys.set(reminder._id.toString(), reminder.id);
                    return await ReminderManager.new(reminder);
                }
                return;
            }

            if (change.operationType === "insert") {
                keys.set(change.documentKey._id.toString(), change.fullDocument.id);
                return ReminderManager.new(change.fullDocument as ReminderSchemaType);
            }

            if (change.operationType === "delete") {
                const id = change.documentKey._id.toString();
                const reminderId = keys.get(id);
                if (reminderId) {
                    const rm = ReminderManager.get(reminderId);
                    if (rm) {
                        await rm.clear();
                        ReminderManager.refreshCollectors(rm.id, rm.userId);
                    }
                }
                return;
            }

            return console.log("Database.Reminders.watch", change);
        });

}