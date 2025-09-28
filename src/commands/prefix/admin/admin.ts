import { Message } from "discord.js";
// import Database from "../../../database";
// import registerlinkedroles from "../../functions/admin/registerlinkedroles";
// import adminBalance from "../../functions/admin/balance";
import commandBlocker from "../../functions/admin/commandBlocker";
import handler from "../../../structures/commands/handler";
import { getStaffInitialComponents, getStaffInitialEmbed } from "../../functions/staff/button.redirect";
import { GlobalStaffManager } from "../../../managers";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default {
    name: "admin",
    description: "Comandos exclusivos para os administradores da Saphire",
    aliases: ["adm"],
    category: "admin",
    api_data: {
        category: "Administração",
        synonyms: ["adm"],
        tags: ["admin"],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { author, userLocale: locale } = message;

        if (!args?.length)
            return await message.reply({
                embeds: getStaffInitialEmbed(locale, "dev", author.toString()),
                components: getStaffInitialComponents(locale, "dev", author.id),
            });

        // if (!GlobalStaffManager.isStaff(author.id))
        //     return await message.reply({
        //         content: t("staff.perms.staff", { e, locale }),
        //     });

        // if (
        //     [
        //         "reiniciar",
        //         "restart",
        //         "reboot",
        //         "reload",
        //     ].includes(args?.[0]?.toLowerCase() || "")
        // ) {

        //     if (!GlobalStaffManager.isDeveloper(author.id))
        //         return await message.reply({ content: t("staff.perms.dev", { e, locale }) });

        //     await GlobalStaffManager.setRebootMessage(args?.slice(1).join(" "));
        //     return await message.reply({
        //         content: t("Saphire.rebooting.inicializing", { e, locale: message.userLocale }),
        //     });
        // }

        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", locale)}` });
        const argument = args?.join(" ")?.toLowerCase() || "";

        if (
            [
                "register global commands",
                "register global slash commands",
                "registrar comandos globais",
                "register slash commands",
                "register slash",
                "r s",
            ].includes(argument)
        ) {

            if (!GlobalStaffManager.isDev(author.id))
                return await msg.edit({ content: t("staff.perms.dev", { e, locale }) });

            const content = await handler.postApplicationCommands(locale);
            return await msg.edit({ content }).catch(() => { });
        }

        // if (
        //     [
        //         "clear cache",
        //         "redis clear",
        //         "flushall",
        //         "c c",
        //     ].includes(argument)
        // ) {

        //     if (!GlobalStaffManager.isAdmin(author.id))
        //         return await msg.edit({ content: t("staff.perms.admin", { e, locale }) });

        //     await sleep(2000);
        //     await msg.edit({ content: `${e.Loading} | Cleaning...` });
        //     await Database.flushAll();
        //     await sleep(2000);
        //     return await msg.edit({ content: t("staff.responses.cache_clear", { e, locale }) });
        // }

        // if (
        //     [
        //         "c games",
        //         "clear games",
        //     ].includes(argument)
        // ) {

        //     if (!GlobalStaffManager.isAdmin(author.id))
        //         return await msg.edit({ content: t("staff.perms.admin", { e, locale }) });

        //     await Database.Games.deleteAll();
        //     return await msg.edit({
        //         content: t("staff.responses.game_cache_cleared", { e, locale }),
        //     }).catch(() => { });
        // }

        // if (
        //     [
        //         "register linked roles",
        //         "r l r",
        //     ].includes(argument)
        // ) {

        //     if (!GlobalStaffManager.isDeveloper(author.id))
        //         return await msg.edit({ content: t("staff.perms.dev", { e, locale }) });

        //     return await registerlinkedroles(message);
        // }

        // if (
        //     [
        //         "b",
        //         "bal",
        //         "balance",
        //         "saldo",
        //         "solde",
        //         "kontostand",
        //         "残高",
        //         "safira",
        //         "safiras",
        //         "sapphire",
        //         "sapphires",
        //         "zafiro",
        //         "saphir",
        //         "サファイア",
        //         "atm",
        //     ].includes(args?.[0]?.toLowerCase() || "")
        // ) {

        //     if (!GlobalStaffManager.isAdmin(author.id))
        //         return await msg.edit({ content: t("staff.perms.admin", { e, locale }) });

        //     return await adminBalance(message, args, msg);
        // }

        if (
            [
                "command",
                "comando",
                "cmd",
                "c",
                "cmds",
                "commands",
                "comandos",
            ].includes(args?.[0]?.toLowerCase() || "")
        ) {

            if (!GlobalStaffManager.isAdmin(author.id))
                return await msg.edit({ content: t("staff.perms.admin", { e, locale }) });

            return await commandBlocker(message, args, msg);
        }

        return await msg.edit({
            embeds: getStaffInitialEmbed(locale, "dev", author.toString()),
            components: getStaffInitialComponents(locale, "dev", author.id),
        });

        // return await msg.edit({ content: t("System_no_data_recieved", { locale, e }) }).catch(() => { });
    },
};