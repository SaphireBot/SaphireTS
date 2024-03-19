import { Colors, Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import client from "../../../saphire";

export default {
    name: "invite",
    description: "Me convite para o seu servidor",
    aliases: ["inv", "convite", "招待", "inviter", "invitar", "convidar"],
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
                description: `${e.Animated.SaphireDance} | ${t("invite_message_embeds.0.description", { locale: message.userLocale, link: client.invite })}`
            }]
        });
    }
};