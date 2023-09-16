import { Message } from "discord.js";

export default {
    name: "ping",
    description: "🏓 Ping pong",
    category: "bot",
    execute: async function (message: Message) {
        return await message.reply({ content: "🏓 Pong" });
    },
};