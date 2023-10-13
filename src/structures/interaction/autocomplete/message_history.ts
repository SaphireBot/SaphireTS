import { AutocompleteInteraction } from "discord.js";
import { t } from "../../../translator";
const oneSecond = 1;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;
const oneDay = oneHour * 24;

export default async function message_history(interaction: AutocompleteInteraction, value: string = "") {

    const options = [
        { name: "✅ " + t("ban.autocomplete.none", interaction.userLocale), value: 0 },
        { name: "✅ " + t("ban.autocomplete.last_hour", interaction.userLocale), value: oneHour },
        { name: "✅ " + t("ban.autocomplete.last_6_hours", interaction.userLocale), value: oneHour * 6 },
        { name: "✅ " + t("ban.autocomplete.last_12_hours", interaction.userLocale), value: oneHour * 12 },
        { name: "✅ " + t("ban.autocomplete.last_24_hours", interaction.userLocale), value: oneDay },
        { name: "✅ " + t("ban.autocomplete.last_3_days", interaction.userLocale), value: oneDay * 3 },
        { name: "✅ " + t("ban.autocomplete.last_7_days", interaction.userLocale), value: oneDay * 7 },
    ];

    const dateMs = value.toDateMS();
    if (dateMs) {
        const date = Date.stringDate(dateMs, false, interaction.userLocale);
        if (date)
            options.unshift({
                name: ((dateMs / 1000) > 604800 ? "❌ " : "✅ ") + date?.limit("AutocompleteName"),
                value: dateMs / 1000
            });
    }

    const num = Number(value);
    if (value?.length && !isNaN(num)) {
        for (const opt of [
            (num * 1000) * 60,
            (num * 1000) * 60 * 60,
            (num * 1000) * 60 * 60 * 24
        ]) {
            if (!opt) continue;
            const date = Date.stringDate(opt, false, interaction.userLocale);
            if (date)
                options.unshift({
                    name: ((opt / 1000) > 604800 ? "❌ " : "✅ ") + date?.limit("AutocompleteName"),
                    value: opt / 1000
                });
        }
    }

    return await interaction.respond(options.slice(0, 25));
}