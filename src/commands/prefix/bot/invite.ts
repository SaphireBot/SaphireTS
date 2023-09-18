import { Colors, Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import client from "../../../saphire";

export default {
    name: "invite",
    description: "Me convite para o seu servidor",
    aliases: ["inv", "convite"],
    category: "bot",
    api_data: {
        category: "Saphire",
        synonyms: ["inv", "convite"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message) {
        return await message.reply({
            embeds: [{
                color: Colors.LightGrey,
                description: `${e.Animated.SaphireDance} | ${t("invite_message_embeds.0.description", { locale: message.userLocale, link: `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&scope=bot%20applications.commands&permissions=2146958847` })}`
            }]
        });
    }
};