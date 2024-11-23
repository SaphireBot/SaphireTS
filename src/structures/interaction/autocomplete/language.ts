import { AutocompleteInteraction } from "discord.js";
import { getLocalizations } from "../../../util/getlocalizations";
const languages = [
    {
        name: "English",
        name_localizations: getLocalizations("setlang.options.0.choices.0.name"),
        value: "en-US",
        localizations: Object.values(getLocalizations("setlang.options.0.choices.0.name")).map(l => l?.toLowerCase()),
    },
    {
        name: "Español",
        name_localizations: getLocalizations("setlang.options.0.choices.1.name"),
        value: "es-ES",
        localizations: Object.values(getLocalizations("setlang.options.0.choices.1.name")).map(l => l?.toLowerCase()),
    },
    {
        name: "Français",
        name_localizations: getLocalizations("setlang.options.0.choices.2.name"),
        value: "fr",
        localizations: Object.values(getLocalizations("setlang.options.0.choices.2.name")).map(l => l?.toLowerCase()),
    },
    {
        name: "Japanese",
        name_localizations: getLocalizations("setlang.options.0.choices.3.name"),
        value: "ja",
        localizations: Object.values(getLocalizations("setlang.options.0.choices.3.name")).map(l => l?.toLowerCase()),
    },
    {
        name: "Portuguese",
        name_localizations: getLocalizations("setlang.options.0.choices.4.name"),
        value: "pt-BR",
        localizations: Object.values(getLocalizations("setlang.options.0.choices.4.name")).map(l => l?.toLowerCase()),
    },
    {
        name: "German",
        name_localizations: getLocalizations("setlang.options.0.choices.5.name"),
        value: "de",
        localizations: Object.values(getLocalizations("setlang.options.0.choices.5.name")).map(l => l?.toLowerCase()),
    },
    {
        name: "Chinese",
        name_localizations: getLocalizations("setlang.options.0.choices.6.name"),
        value: "zh-CN",
        localizations: Object.values(getLocalizations("setlang.options.0.choices.6.name")).map(l => l?.toLowerCase()),
    },
];

export default async function language(interaction: AutocompleteInteraction, value: string) {

    const v = value?.toLowerCase();
    const locale = interaction.userLocale || interaction.guild?.preferredLocale;
    const data = languages
        .filter(d => [d.name.toLowerCase(), d.value.toLowerCase(), d.localizations].flat().some(str => str?.includes(v)))
        .map(d => ({
            name: d.name_localizations[locale as keyof typeof d.name_localizations] || d.name,
            value: d?.value,
        }));

    return await interaction.respond(data);
}