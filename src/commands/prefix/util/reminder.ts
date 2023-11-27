import { Message } from "discord.js";
import view from "../../functions/reminder/view";
import create from "../../functions/reminder/create";
import { e } from "../../../util/json";
import { t } from "../../../translator";
const aliases = ["lembrete", "erinnerung", "提醒", "リマインダー", "rappel", "recordatorio", "rm"];

export default {
    name: "reminder",
    description: "Colete prêmios diários com este comando",
    aliases,
    category: "util",
    api_data: {
        category: "Utilidades",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, args: string[] | undefined) {

        const { userLocale: locale, channel } = message;

        if (
            args?.[0] &&
            [
                "view",
                "v",
                "view",
                "anzeigen",
                "查看",
                "表示する",
                "visualiser",
                "visualizar",

                "lista",
                "list",
                "liste",
                "列表",
                "リスト"
            ].includes(args[0]?.toLowerCase())
        )
            return await view(message);

        if (!args?.[0])
            return await message.reply({ content: t("reminder.no_content", { e, locale }) });

        const msg = await message.reply({ content: t("reminder.what_time", { e, locale }) });
        const content = args.join(" ");

        const collector = channel.createMessageCollector({
            filter: msg => msg.author.id === message.author.id,
            max: 1,
            time: 1000 * 60
        })
            .on("collect", async (msg): Promise<any> => {
                collector.stop();
                if (!msg.content?.length) return;
                return await create(message, { dm: false, interval: 0, message: content, time: msg.content });
            })
            .on("end", (): any => msg.delete());
        return;
    }
};