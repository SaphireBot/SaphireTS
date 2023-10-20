import { AutocompleteInteraction } from "discord.js";

export default async function roles(interaction: AutocompleteInteraction, value: string) {

    const v = value?.split(/ /g).at(-1)?.toLowerCase() || "";
    const roles = interaction.guild?.roles.cache
        .filter(role => role.name?.toLowerCase()?.includes(v) || role.id.includes(v))
        .map(role => ({ name: role.name, value: role.id }))
        .slice(0, 25) || [];

    return await interaction.respond(roles);
}