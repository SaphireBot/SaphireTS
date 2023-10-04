import { APIActionRowComponent, APIApplicationCommand, APIMessageActionRowComponent, APIModalInteractionResponseCallbackData, ActionRowData, ChatInputCommandInteraction, JSONEncodable, Message, MessageActionRowComponentBuilder, MessageActionRowComponentData, ModalComponentData, Role, Snowflake } from "discord.js";

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

export interface GiveawayCollectorData {
    reaction: string
    AllowedRoles: string[]
    LockedRoles: string[]
    AllowedMembers: string[]
    LockedMembers: string[]
    AddRoles: string[]
    MultJoinsRoles: Map<string, RoleGiveaway>
    RequiredAllRoles: boolean
}

export interface RoleGiveaway {
    role: Role
    joins: number
}

export interface TransactionsType {
    createdAt: Date
    value: number
    type: "gain" | "loss" | "admin" | "system"
    method: "add" | "sub" | "set"
    keywordTranslate: "jokempo.transactions.gain" | "jokempo.transactions.gain_global" | "jokempo.transactions.loss" | "jokempo.transactions.global_lance" | "Saphire.transactions.bug"
}