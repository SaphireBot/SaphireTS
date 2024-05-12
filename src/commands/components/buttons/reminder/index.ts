import { ButtonInteraction, time } from "discord.js";
import { ReminderButtonDispare } from "../../../../@types/customId";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { ReminderManager } from "../../../../managers";
import modals from "../../../../structures/modals";
import Database from "../../../../database";

export default async function reminder(interaction: ButtonInteraction<"cached">, data: ReminderButtonDispare) {

    const { userLocale: locale, user, message } = interaction;

    if (user.id !== data.uid)
        return await interaction.reply({
            content: t("reminder.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    const components = message.components;

    const reminder = data.rid
        ? await ReminderManager.fetch(data.rid)
        : await ReminderManager.fetchReminderByMessageId(message.id);

    if (!reminder)
        return await interaction.update({ content: t("reminder.not_found", { e, locale }), embeds: [], components: [] });

    if (reminder.deleteAt && (Date.now() >= reminder.deleteAt.valueOf())) {
        await ReminderManager.remove(reminder.id);
        return await interaction.update({ content: null });
    }

    if (data.src === "revalidate")
        return await interaction.showModal(modals.reminderRevalidate(reminder, locale));

    if (data.src === "delete") {
        await ReminderManager.remove(reminder.id);
        return message.embeds.length
            ? await interaction.update({ content: null })
            : await message.delete().catch(() => { });
    }

    if (data.src === "snooze") {
        const snooze = await ReminderManager.snooze(reminder.id);
        if (!snooze) return await interaction.update({ content: t("reminder.cant_snooze", { e, locale }), components: [] });

        return await interaction.update({
            content: t("reminder.snooze_success", { e, locale, time: time(new Date(Date.now() + 1000 * 60 * 10), "R") }),
            components: []
        });
    }

    if (data.src === "move") {

        return reminder.channelId === interaction.channelId
            ? await interaction.update({ components })
            : await Database.Reminders.updateOne(
                { id: reminder.id },
                {
                    $set: {
                        channelId: interaction.channelId,
                        guildId: interaction.guildId
                    }
                }
            )
                .then(async () => await interaction.update({ content: null }))
                .catch(async () => {
                    await interaction.update({ components });
                    return await interaction.reply({
                        content: t("reminder.move_failled", { e, locale }),
                        ephemeral: true
                    });
                });

    }

    return await interaction.update({ content: "#1SD51D5WE51D", components: [] });

}