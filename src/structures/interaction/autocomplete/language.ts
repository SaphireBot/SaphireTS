import { AutocompleteInteraction } from "discord.js";
import { getLocalizations } from "../../../util/getlocalizations";
const languages = [
    {
        name: "English",
        name_localizations: getLocalizations("setlang.options.0.choices.0.name"),
        value: "en-US"
    },
    {
        name: "Español",
        name_localizations: getLocalizations("setlang.options.0.choices.1.name"),
        value: "es-ES"
    },
    {
        name: "Français",
        name_localizations: getLocalizations("setlang.options.0.choices.2.name"),
        value: "fr"
    },
    {
        name: "Japanese",
        name_localizations: getLocalizations("setlang.options.0.choices.3.name"),
        value: "ja"
    },
    {
        name: "Portuguese",
        name_localizations: getLocalizations("setlang.options.0.choices.4.name"),
        value: "pt-BR"
    },
    {
        name: "German",
        name_localizations: getLocalizations("setlang.options.0.choices.5.name"),
        value: "de"
    },
    {
        name: "Chinese",
        name_localizations: getLocalizations("setlang.options.0.choices.6.name"),
        value: "zh-CN"
    }
];
const allLangs = languages.map(d => d.name_localizations).flat().map(d => Object.values(d)).flat().filter(d => d?.toLowerCase());

export default async function language(interaction: AutocompleteInteraction, value: string) {

    const v = value?.toLowerCase();
    const locale = interaction.userLocale || interaction.guildLocale;
    const data = languages
        .filter(d => d.name?.toLowerCase()?.includes(v)
            || allLangs.includes(v)
            || d.value?.toLowerCase().includes(v)
        )
        .map(d => ({
            name: d.name_localizations[locale as keyof typeof d.name_localizations] || d.name,
            value: d?.value
        }));

    if (!data?.length) return await interaction.respond([]);
    return await interaction.respond(data);
}