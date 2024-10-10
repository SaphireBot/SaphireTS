import { Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
import registerlinkedroles from "../../functions/admin/registerlinkedroles";
import adminBalance from "../../functions/admin/balance";
import commandBlocker from "../../functions/admin/commandBlocker";
import handler from "../../../structures/commands/handler";
import client from "../../../saphire";

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

        const clientData = await Database.getClientData();
        if (!clientData?.Administradores?.includes(message.author.id))
            return await message.reply({
                content: `${e.Animated.SaphireReading} | ${t("System_cannot_use_this_command", message.userLocale)}`,
            })
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000));

        if (!args?.length)
            return await message.reply({ content: `${e.Animated.SaphireReading} | ${t("System_no_data_given", message.userLocale)}` });

        if (
            [
                "reiniciar",
                "restart",
                "reboot",
                "reload",
            ]
                .includes(args?.[0]?.toLowerCase() || "")
        ) {

            await Database.Client.updateOne(
                { id: client.user!.id },
                {
                    $set: {
                        rebooting: {
                            started: true,
                            reason: args?.slice(1).join(" "),
                            webhooks: [],
                        },
                    },
                },
            );

            return await message.reply({
                content: t("Saphire.rebooting.inicializing", { e, locale: message.userLocale }),
            });
        }

        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", message.userLocale)}` });
        const argument = args?.join(" ")?.toLowerCase();

        if (
            [
                "register global commands",
                "registrar comandos globais",
                "register slash commands",
                "register slash",
                "r s",
            ].includes(argument)
        )
            return await msg.edit({ content: await handler.postApplicationCommands() }).catch(() => { });

        if (
            [
                "clear cache",
                "redis clear",
                "flushall",
                "c c",
            ].includes(argument)
        ) {
            await msg.edit({ content: `${e.Loading} | Cleaning...` });
            await Database.flushAll();
            return await msg.edit({ content: `${e.CheckV} | All caches have been cleared` });
        }

        if (argument.toLowerCase() === "c games") {
            await Database.Games.deleteAll();
            return await message.react(e.CheckV).catch(() => { });
        }

        if (
            [
                "register linked roles",
                "r l r",
            ].includes(argument)
        )
            return await registerlinkedroles(message);

        if (
            [
                "b",
                "bal",
                "balance",
                "saldo",
                "solde",
                "kontostand",
                "残高",
                "safira",
                "safiras",
                "sapphire",
                "sapphires",
                "zafiro",
                "saphir",
                "サファイア",
                "atm",
            ].includes(args?.[0]?.toLowerCase() || "")
        )
            return await adminBalance(message, args, msg);

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
        )
            return await commandBlocker(message, args, msg);

        return await msg.edit({ content: t("System_no_data_recieved", { locale: message.userLocale, e }) }).catch(() => { });
    },
};