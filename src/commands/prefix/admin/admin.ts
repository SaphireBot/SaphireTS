import { Message } from "discord.js";
import client from "../../../saphire";
import { e } from "../../../util/json";
import { registerCommands } from "../..";

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
        console.log(clientData);
        if (!clientData?.Administradores?.includes(message.author.id))
            return await message.reply({
                content: `${e.Animated.SaphireReading} | Você não pode usar esse comando, ok?`
            })
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000));

        if (!args)
            return await message.reply({ content: `${e.Animated.SaphireReading} | Nenhum argumento entregue.` });

        const msg = await message.reply({ content: `${e.Loading} | Carregando...` });
        
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

        return msg.edit({ content: `${e.Animated.SaphireReading} | Nenhum argumento válido foi encontrado.` }).catch(() => { });
    }
};