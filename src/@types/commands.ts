import { APIActionRowComponent, APIApplicationCommand, APIMessageActionRowComponent, APIModalInteractionResponseCallbackData, ActionRowData, ChatInputCommandInteraction, JSONEncodable, Message, MessageActionRowComponentBuilder, MessageActionRowComponentData, ModalComponentData, Snowflake } from "discord.js";

export interface PrefixCommandType {
    name: string
    description: string
    category: string
    aliases: string[]
    api_data: Command_Api_Data
    execute: (message: Message, args?: string[]) => Promise<void>
}

export interface SlashCommandType {
    data: APIApplicationCommand & { id?: Snowflake }
    additional: {
        category: string
        dm_permission: boolean
        database: boolean
        admin: boolean
        staff: boolean
        api_data: Command_Api_Data
        execute: (interaction: ChatInputCommandInteraction) => Promise<void>
    }
}

export interface Command_Api_Data {
    name: string
    description: string
    category: string
    synonyms: string[]
    tags: string[]
    aliases: string[]
    perms: {
        user: string[]
        bot: string[]
    }
}

export type BaseMessageOptionsComponent = (
    | JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>
    | ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>
    | APIActionRowComponent<APIMessageActionRowComponent>
);

export type ModalMessageOptionsComponent = JSONEncodable<APIModalInteractionResponseCallbackData>
    | ModalComponentData
    | APIModalInteractionResponseCallbackData;