import { ReminderManager } from "../..";
import { WatchChange } from "../../../@types/database";
import Database from "../../../database";
// import client from "../../../saphire";
export const keys = new Map<string, string>();

export async function watch() {

    // client.on("remove_reminder", (reminderId: string | undefined) => {
    //     if (!reminderId) return;
    //     ReminderManager.clear(reminderId);
    // });

    return Database.Reminders.watch()
        .on("change", (change: WatchChange) => {

            if (["update", "insert"].includes(change.operationType)) return;

            if (change.operationType === "delete") {
                const key = keys.get(change.documentKey._id.toString());
                if (key) ReminderManager.clear(key);
                return;
            }

            return console.log(change);
        });

}