import { Message } from "discord.js";
import { slashCommands } from "../..";

export default {
    name: "botinfo",
    description: "A way to see the bot info",
    aliases: [],
    category: "bot",
    api_data: {
        category: "Saphire",
        synonyms: [],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, _: string[] | undefined) {
        const command = slashCommands.get("botinfo");
        if (!command?.additional?.execute) return;
        return command.additional.execute(message as any);
    }
};