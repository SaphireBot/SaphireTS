import { Message } from "discord.js";
import handler from "../../../structures/commands/handler";

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
        const command = handler.getSlashCommand("botinfo");
        if (!command?.additional?.execute) return;
        return await command.additional.execute(message as any);
    }
};