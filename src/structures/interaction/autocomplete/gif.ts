import { AutocompleteInteraction } from "discord.js";
import { allGifsAvailable, interactionsEntries } from "../../../commands/functions/fun/gifs";
import { t } from "../../../translator";

export default async function gif(interaction: AutocompleteInteraction, value: string) {

    const { userLocale: locale } = interaction;
    const endpoints = Array.from(allGifsAvailable.keys());
    const keySearch = interactionsEntries.find(([_, values]) => values.some(val => val.includes(value?.toLowerCase())))?.[0];

    const options = endpoints
        .filter(Boolean)
        .map(endpoint => ({ endpoint, translate: t(`anime.indication.${endpoint}`, locale) }))
        .filter(v => v?.endpoint?.includes(value?.toLowerCase())
            || v?.translate?.includes(value?.toLowerCase())
            || keySearch === v.endpoint
        )
        .map(v => ({ name: v.translate, value: v.endpoint }));

    if (!options?.length) return await interaction.respond([{ name: t("interactions.any_endpoint_available", locale), value: "ignore" }]);

    options.unshift({
        name: t("interactions.autocomplete_all_interactions", locale),
        value: "all"
    });

    return await interaction.respond(options.slice(0, 25));
}