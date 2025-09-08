import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";

export default async function revalidate(
    interaction: ModalSubmitInteraction<"cached">,
    data: {
        id: string
        c: "reminder"
    },
) {

    const { userLocale: locale, message, fields } = interaction;
    const text = fields.getTextInputValue("text");
    const time = fields.getTextInputValue("time")?.limit(1500);
    const timeMs = time.toDateMS();
    const dateNow = Date.now();

    // 5 seconds - 2 years
    if (
        (dateNow + timeMs) <= (dateNow + 4999)
        || timeMs > 63115200000
    )
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("reminder.over_time_except", { e, locale }),
        });

    await interaction.deferUpdate().catch(() => { });

    const reminder = await Database.Reminders.updateOne(
        { id: data.id },
        {
            $set: {
                message: text,
                lauchAt: new Date(Date.now() + timeMs),
                alerted: false,
            },
            $unset: {
                deleteAt: true,
                messageId: true,
                disableComponents: true,
            },
        },
    )
        .then(() => true)
        .catch(() => false);

    if (!reminder)
        return await interaction.followUp({
            flags: [MessageFlags.Ephemeral],
            content: t("reminder.not_found", { e, locale }),
        });

    if (message?.embeds.length)
        return await interaction.editReply({ content: null });
    else await message?.delete().catch(() => { });

    return await interaction.followUp({
        flags: [MessageFlags.Ephemeral],
        content: t("reminder.success", {
            e,
            locale,
            message: text.length < 250
                ? ` ${t("reminder.of", locale)} \`${text}\` `
                : " ",
            date: timeMs > 86400000
                ? `${t("reminder.at_day", locale)} ${Date.toDiscordTime(timeMs + 1000, dateNow, "F")} (${Date.toDiscordTime(timeMs + 1000, dateNow, "R")})`
                : Date.toDiscordTime(timeMs + 1000, dateNow, "R"),
        }),
    });
}