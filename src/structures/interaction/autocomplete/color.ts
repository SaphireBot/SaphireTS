import { AutocompleteInteraction, Colors } from "discord.js";
import { t } from "../../../translator";
const colors = Object.entries(Colors);

export default async function color(interaction: AutocompleteInteraction, value: string = "") {

    const filterMapped = colors.filter(([name, color]) => name?.includes(value?.toLowerCase())
        || `${color}`.includes(value)
    )
        .map(([name, color]) => ({ name: t(`Discord.Color.${name}`, interaction.userLocale), value: color }))
        .slice(0, 25);

    return await interaction.respond(filterMapped);

}