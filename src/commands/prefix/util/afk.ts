import { Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { AfkManager } from "../../../managers";

export default {
    name: "afk",
    description: "set a message to display when someone mention you",
    aliases: ["offline", "off"],
    category: "util",
    api_data: {
        category: "Utilidades",
        synonyms: [],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { userLocale: locale, guild, author } = message;
        const text = args?.join(" ") || "";

        const msg = await message.reply({ content: t("afk.loading", { e, locale }) });
        const response = await AfkManager.set(author.id, text, guild.id, "guild");

        await msg.edit({
            content: t(
                response ? "afk.success" : "afk.fail",
                {
                    e,
                    locale,
                    message: text?.length ? `\n📝 | ${text}` : ""
                }
            ).limit("MessageContent")
        });

        setTimeout(() => {
            msg.delete();
            message.delete().catch(() => { });
            return;

        }, 5000);
    }
};