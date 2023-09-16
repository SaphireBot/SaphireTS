import { Message } from "discord.js";

export interface PrefixCommandType {
    name: string
    description: string
    category: string
    execute: (message: Message) => Promise<void>
}
