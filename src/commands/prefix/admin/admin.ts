import { Message } from "discord.js";
import client from "../../../saphire";
import { e } from "../../../util/json";
import { registerCommands } from "../..";
import { t } from "../../../translator";

export default {
    name: "admin",
    description: "Comandos exclusivos para os administradores da Saphire",
    aliases: [],
    category: "admin",
    api_data: {
        category: "Administração",
        synonyms: [],
        tags: ["admin"],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, args: string[] | undefined) {

        const clientData = await client.getData();
        if (!clientData?.Administradores?.includes(message.author.id))
            return await message.reply({
                content: `${e.Animated.SaphireReading} | ${t("System_cannot_use_this_command", message.userLocale)}`
            })
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000));

        if (!args)
            return await message.reply({ content: `${e.Animated.SaphireReading} | ${t("System_no_data_given", message.userLocale)}` });

        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", message.userLocale)}` });

        const argument = args?.join(" ");

        if (
            [
                "register global commands",
                "registrar comandos globais",
                "register slash commands",
                "register slash"
            ].includes(argument)
        )
            return await msg.edit({ content: await registerCommands() }).catch(() => { });

        return msg.edit({ content: t("System_no_data_recieved", { locale: message.userLocale, e }) }).catch(() => { });
    }
};