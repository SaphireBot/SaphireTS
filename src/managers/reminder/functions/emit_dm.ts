import { ReminderManager } from "../..";
import { ReminderType } from "../../../@types/commands";
import client from "../../../saphire";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { time } from "discord.js";
import { intervalTime } from "../manager";
import Database from "../../../database";

export default async function emit_dm(data: ReminderType) {

    const locale = (await Database.getUser(data.userId))?.locale || "en-US";

    const intervalMessage = data.interval === 0
        ? ""
        : `\n${t("reminder.emit_again_in", { locale, time: time(new Date(Date.now() + intervalTime[data.interval]), "R") })}`;

    if (data.isAutomatic)
        data.RemindMessage = t(data.RemindMessage, locale);

    return await client.users.send(
        data.userId,
        { content: t("reminder.new_notification", { e, locale, data, intervalMessage }).limit("MessageContent") }
    )
        .then(async () => {

            if ([1, 2, 3].includes(data.interval)) {
                return await ReminderManager.revalide(
                    data.id,
                    Date.now(),
                    false,
                    Date.now() + intervalTime[data.interval as 1 | 2 | 3]
                );
            }

            return await ReminderManager.remove(data.id);
        })
        .catch(() => ReminderManager.remove(data.id));
}