import { Message } from "discord.js";
import { e } from "../../../util/json";
import { registerCommands } from "../..";
import { t } from "../../../translator";
import Database from "../../../database";
import registerlinkedroles from "../../functions/admin/registerlinkedroles";

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
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const clientData = await Database.getClientData();
        if (!clientData?.Administradores?.includes(message.author.id))
            return await message.reply({
                content: `${e.Animated.SaphireReading} | ${t("System_cannot_use_this_command", message.userLocale)}`
            })
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000));

        if (!args?.length)
            return await message.reply({ content: `${e.Animated.SaphireReading} | ${t("System_no_data_given", message.userLocale)}` });
        
        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", message.userLocale)}` });

        const argument = args?.join(" ");

        if (
            [
                "register global commands",
                "registrar comandos globais",
                "register slash commands",
                "register slash",
                "r s"
            ].includes(argument)
        )
            return await msg.edit({ content: await registerCommands() }).catch(() => { });

        if (
            [
                "clear cache",
                "redis clear",
                "flushall",
                "c c"
            ].includes(argument)
        ) {
            await msg.edit({ content: `${e.Loading} | Cleaning...` });
            await Database.Redis.flushAll();
            await Database.Ranking.flushAll();
            await Database.UserCache.flushAll();
            return await msg.edit({ content: `${e.CheckV} | All caches have been cleared` });
        }

        if (
            [
                "register linked roles",
                "r l r"
            ].includes(argument)
        )
            return await registerlinkedroles(message);

        return msg.edit({ content: t("System_no_data_recieved", { locale: message.userLocale, e }) }).catch(() => { });
    }
};