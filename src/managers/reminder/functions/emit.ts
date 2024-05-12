import { ButtonStyle, TextChannel, parseEmoji, time } from "discord.js";
import { ReminderManager } from "../..";
import { ReminderType } from "../../../@types/commands";
import client from "../../../saphire";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { intervalTime } from "../manager";

export default async function emit(reminder: ReminderType) {

    if (!reminder.guildId || !reminder.channelId) return await ReminderManager.clear(reminder.id);

    const guild = await client.guilds.fetch(reminder.guildId).catch(() => null);
    if (!guild) return await ReminderManager.clear(reminder.id);

    const channel = await guild.channels.fetch(reminder.channelId).catch(() => null) as TextChannel;
    if (!channel) return await ReminderManager.clear(reminder.id);

    const member = await guild.members.fetch(reminder.userId).catch(() => null);
    if (!member) return await ReminderManager.clear(reminder.id);

    const locale = await member.user?.locale();

    const intervalMessage = reminder.interval === 0
        ? ""
        : `\n${t("reminder.emit_again_in", { locale, time: time(new Date(Date.now() + intervalTime[reminder.interval]), "R") })}`;

    if (reminder.isAutomatic)
        reminder.message = t(reminder.message, locale);

    return await channel.send({
        content: t("reminder.new_notification", { e, locale, data: reminder, intervalMessage }).limit("MessageContent"),
        components: [1, 2, 3].includes(reminder.interval) || reminder.isAutomatic
            ? []
            : [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("reminder.snooze", locale),
                            emoji: parseEmoji(e.Notification),
                            custom_id: JSON.stringify({ c: "rmd", src: "snooze", uid: reminder.userId }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("reminder.revalidate", locale),
                            emoji: parseEmoji("📅"),
                            custom_id: JSON.stringify({ c: "rmd", src: "revalidate", uid: reminder.userId }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("reminder.delete", locale),
                            emoji: parseEmoji(e.Trash),
                            custom_id: JSON.stringify({ c: "rmd", src: "delete", uid: reminder.userId }),
                            style: ButtonStyle.Danger
                        }
                    ]
                }
            ].asMessageComponents(),
        allowedMentions: {
            users: [reminder.userId],
            roles: []
        }
    })
        .then(async message => await ReminderManager.setAlert(reminder.id, Date.now() + 172800000, message.id))
        .catch(async () => await ReminderManager.remove(reminder.id));

}