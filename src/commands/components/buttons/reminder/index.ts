import { ButtonInteraction } from "discord.js";
import { ReminderButtonDispare } from "../../../../@types/customId";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { ReminderManager } from "../../../../managers";
import modals from "../../../../structures/modals";

export default async function reminder(interaction: ButtonInteraction<"cached">, data: ReminderButtonDispare) {

    const { userLocale: locale, user, message, guild, channel } = interaction;

    if (user.id !== data.uid)
        return await interaction.reply({
            content: t("reminder.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    const components = message.components;
    const reminder = await (async () => {
        if (ReminderManager.cache.has(data.rid!))
            return ReminderManager.get(data.rid!);

        return await ReminderManager.fetchReminderByMessageId(message.id);
    })();

    if (!reminder)
        return await interaction.update({ content: t("reminder.not_found", { e, locale }), embeds: [], components: [] });

    if (reminder.deleteAt && (Date.now() >= reminder.deleteAt.valueOf())) {
        await ReminderManager.delete(reminder.id);
        return await interaction.update({ content: null });
    }

    if (data.src === "revalidate")
        return await interaction.showModal(modals.reminderRevalidate(reminder, locale));

    if (data.src === "delete") {
        await ReminderManager.delete(reminder.id);
        return message.embeds.length
            ? await interaction.update({ content: null })
            : await message.delete().catch(() => { });
    }

    if (data.src === "snooze") {
        const snooze = await ReminderManager.snooze(reminder.id);
        if (!snooze) return await interaction.update({ content: t("reminder.cant_snooze", { e, locale }), components: [] });

        return await message.delete().catch(() => { });
    }

    if (data.src === "move") {
        const move = await ReminderManager.move(reminder.id, guild.id, channel?.id);

        if (typeof move === "boolean")
            return await interaction.update({ content: null });

        await interaction.update({ components });
        return await interaction.followUp({
            content: `${t("reminder.move_failled", { e, locale })}\n${e.bug} | \`${move}\``,
            ephemeral: true
        });

    }

    return await interaction.update({ content: "#1SD51D5WE51D", components: [] });

}