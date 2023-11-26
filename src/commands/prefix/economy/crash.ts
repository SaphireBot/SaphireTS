import { Message, time } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
import Crash from "../../../structures/crash/crash";

export default {
    name: "crash",
    description: "Good luck with crash!",
    aliases: [],
    category: "economy",
    api_data: {
        category: "Economia",
        synonyms: [],
        tags: ["new"],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { userLocale: locale, author, channelId, guildId } = message;

        if (!args?.length)
            return await message.reply({
                content: t("crash.no_arguments_given", { e, locale })
            });

        const balance = (await Database.getUser(author.id))?.Balance || 0;

        if (balance <= 0)
            return await message.reply({
                content: t("crash.negative_balance", { e, locale, balance })
            });

        const value = ["all", "tudo", "alle", "tout", "すべて"].includes(args[0])
            ? balance
            : args?.[0]?.toNumber();

        if (!value || isNaN(value))
            return await message.reply({
                content: t("crash.value_unknown", { e, locale })
            });

        if (balance < value)
            return await message.reply({
                content: t("crash.balance_not_enough", { e, locale, valueNeeded: (value - balance).currency() })
            });

        const msg = await message.reply({ content: t("crash.loading", { e, locale }) });
        const crash = new Crash({ channelId, guildId, value, message: msg });
        crash.load();

        return await msg.edit({
            content: t("crash.iniciating_in", { e, locale, time: time(new Date(Date.now() + 15000), "R"), value: value.currency() }),
            components: crash.components
        });
    }
};