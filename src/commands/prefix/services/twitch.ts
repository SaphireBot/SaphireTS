import { Message, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import enable from "../../functions/twitch/enable";
import list from "../../functions/twitch/list";
import disable from "../../functions/twitch/disable";
import search from "../../functions/twitch/search";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";

export default {
    name: "twitch",
    description: "A simple way to get a notification when streamer is online",
    aliases: ["tw"],
    category: "services",
    api_data: {
        category: "Serviços",
        synonyms: ["tw"],
        tags: [],
        perms: {
            user: [DiscordPermissons.ManageGuild],
            bot: [DiscordPermissons.ManageGuild]
        }
    },
    execute: async function (message: Message<true>, args: string[]) {

        const { userLocale: locale, guild, member } = message;

        if (!args[0])
            return await message.reply({ content: t("twitch.no_args_given", { e, locale, prefix: (await Database.getPrefix(guild.id)).random() }) });

        if (
            [
                "l",
                "list",
                "lista",
                "liste",
                "リスト"
            ].includes(args[0])
        )
            return await list(message);

        if (
            [
                "search",
                "pesquisar",
                "recherchieren",
                "research",
                "investigar",
                "rechercher",
                "forschen",
                "調査する"
            ].includes(args[0])
        )
            return await search(message, args.slice(1));

        if (!member?.permissions.has(PermissionFlagsBits.ManageGuild, true))
            return await permissionsMissing(message, [DiscordPermissons.ManageGuild], "Discord_you_need_some_permissions");

        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild, true))
            return await permissionsMissing(message, [DiscordPermissons.ManageGuild], "Discord_client_need_some_permissions");

        if (
            [
                // Desativar
                "d",
                "disativar",
                "desligar",
                "deaktivieren",
                "deactivate",
                "disable",
                "désactiver",
                "無効にする",
                "apagar",
                "delete",

                // Desligar
                "ausschalten",
                "éteindre",
                "切る",

                // Cancelar
                "cancelar",
                "cancel",
                "annuler",
                "stornieren",
                "absagen",
                "キャンセルする"
            ].includes(args[0])
        )
            return await disable(message);

        if (
            [
                // active
                "ativar",
                "enable",
                "aktivieren",
                "activate",
                "activar",
                "activer",
                "active",
                "アクティベート",
                "s", // save
                "save", // save

                // turn on
                "einschalten",
                "encender",
                "allumer",
                "電源を入れる"
            ].includes(args[0]?.toLowerCase())
        )
            return await enable(message, args.filter(str => !str.includes("#")).slice(1));

        return await message.reply({ content: t("twitch.no_args_given", { e, locale, prefix: (await Database.getPrefix(guild.id)).random() }) });
    }
};