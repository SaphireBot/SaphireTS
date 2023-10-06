import { AutocompleteInteraction } from "discord.js";
import { t } from "../../../translator";

export default async function timeOptions(interaction: AutocompleteInteraction, value?: string) {

    const locale = interaction.locale;
    const options = [
        {
            name: t("pay.autocomplete.1minute", locale),
            value: "1m"
        },
        {
            name: t("pay.autocomplete.10minutes", locale),
            value: "10m"
        },
        {
            name: t("pay.autocomplete.15minutes", locale),
            value: "15m"
        },
        {
            name: t("pay.autocomplete.20minutes", locale),
            value: "20m"
        },
        {
            name: t("pay.autocomplete.30minutes", locale),
            value: "30m"
        },
        {
            name: t("pay.autocomplete.40minutes", locale),
            value: "40m"
        },
        {
            name: t("pay.autocomplete.50minutes", locale),
            value: "50m"
        },
        {
            name: t("pay.autocomplete.1hour", locale),
            value: "1h"
        },
        {
            name: t("pay.autocomplete.1hours30minutes", locale),
            value: "1h 30m"
        },
        {
            name: t("pay.autocomplete.2hours", locale),
            value: "2h"
        },
        {
            name: t("pay.autocomplete.3hours", locale),
            value: "3h"
        },
        {
            name: t("pay.autocomplete.5hours", locale),
            value: "5h"
        },
        {
            name: t("pay.autocomplete.2days", locale),
            value: "2d"
        },
        {
            name: t("pay.autocomplete.3days", locale),
            value: "3d"
        },
        {
            name: t("pay.autocomplete.4days", locale),
            value: "4d"
        },
        {
            name: t("pay.autocomplete.5days", locale),
            value: "5d"
        },
        {
            name: t("pay.autocomplete.6days", locale),
            value: "6d"
        },
        {
            name: t("pay.autocomplete.7days", locale),
            value: "7d"
        }
    ]
        .filter(opt => opt.name.includes(value!) || opt.value.includes(value!));

    if (value && !options.some(v => v.value === value))
        options.push({ name: value, value });

    return await interaction.respond(options.slice(0, 25));
}