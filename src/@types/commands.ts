import { APIActionRowComponent, APIApplicationCommand, APIMessageActionRowComponent, APIModalInteractionResponseCallbackData, ActionRowData, ChatInputCommandInteraction, JSONEncodable, Message, MessageActionRowComponentBuilder, MessageActionRowComponentData, ModalComponentData, Role, Snowflake } from "discord.js";
import { Types } from "mongoose";

export interface PrefixCommandType {
    name: string
    description: string
    category: string
    aliases: string[]
    api_data: Command_Api_Data
    building?: boolean
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
        building?: boolean
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
    mode: "pay" | "crash" | "jokempo" | "system" | "daily"
    userIdentify?: string;
    keywordTranslate: "jokempo.transactions.gain"
    | "jokempo.transactions.gain_global"
    | "jokempo.transactions.loss"
    | "jokempo.transactions.global_lance"
    | "jokempo.transactions.refund"
    | "Saphire.transactions.bug"
    | "pay.transactions.expired"
    | "pay.transactions.cancelled"
    | "pay.transactions.recieved"
    | "pay.transactions.sended"
    | "pay.transactions.unknown"
    | "crash.transactions.refund"
    | "crash.transactions.taked"
    | "crash.transactions.beted"
    | "daily.transactions.transfer"
    | "daily.transactions.claimmed"
}

export interface PayDataType {
    value: number
    users: {
        from: string
        to: string
    };
    confirms: {
        from: boolean
        to: boolean
    }
    createdAt: Date
    guildId: string
    timeout?: NodeJS.Timeout
}

export interface applicationRPCData {
    id: string
    name: string
    icon: string
    description: string
    summary: string
    cover_image: string
    primary_sku_id: string
    type: null
    hook: boolean
    slug: string
    guild_id: string
    bot_public: boolean
    bot_require_code_grant: boolean
    interactions_endpoint_url: string
    install_params: {
        scopes: string[]
        permissions: string
    },
    terms_of_service_url: string
    privacy_policy_url: string
    custom_install_url: string
    verify_key: string
    flags: number
    tags: string[]
    code: number
    message: "Unknown Application" | string
}

export interface CrashGameData {
    guildId: string,
    channelId: string,
    value: number,
    message: Message<true>
}

export interface DiscordSummaryStatus {
    page: {
        id: string
        name: "Discord"
        url: string
        time_zone: string | null
        updated_at: string | null
    }
    status: {
        description: "All Systems Operational" | "Partial System Outage" | "Major Service Outage"
        indicator: "none" | "minor" | "major" | "critical" | string
    }
    components: ComponentDiscordStatusData[]
    incidents: DiscordIncidentsStatus[]
    scheduled_maintenances: DiscordScheduledMaintenancesStatus[]
    error: Error
}

export interface DiscordScheduledMaintenancesStatus {
    created_at: string | null
    id: string
    impact: "none" | "minor" | "major" | "critical"
    incident_updates: [
        {
            body: string | null
            created_at: string | null
            display_at: string | null
            id: string
            incident_id: string
            status: "scheduled" | "in progress" | "verifying" | "completed"
            updated_at: string | null
        }
    ],
    monitoring_at: null
    name: string
    page_id: string
    resolved_at: string | null,
    scheduled_for: string | null,
    scheduled_until: string | null,
    shortlink: string | null,
    status: "scheduled" | "in progress" | "verifying" | "completed"
    updated_at: string | null
}

interface DiscordIncidentsStatus {
    created_at: string | null
    id: string | null
    impact: "none" | "minor" | "major" | "critical"
    incident_updates: DiscordIncidentsUpdate[]
    monitoring_at: null
    name: string
    page_id: string | null
    resolved_at: string | null
    shortlink: string | null
    status: "investigating" | "identified" | "monitoring" | "resolved" | "postmortem"
    updated_at: string | null
}

interface DiscordIncidentsUpdate {
    body: string
    created_at: string | null
    display_at: string | null
    id: string | null
    incident_id: string | null
    status: "investigating" | "identified" | "monitoring" | "resolved" | "postmortem"
    updated_at: string | null
}

interface ComponentDiscordStatusData {
    id: string
    name: string
    status: "operational" | "degraded_performance" | "partial_outage" | "major_outage"
    created_at: string | null
    updated_at: string | null
    position: number
    description: null | string
    showcase: boolean
    start_date: string | null
    group_id: null
    page_id: string
    group: boolean
    only_show_if_degraded: boolean
}

export interface ReminderType {
    _id?: Types.ObjectId
    __v?: any
    id: string
    userId: string
    guildId: string | null
    message: string
    lauchAt: Date
    timeout?: NodeJS.Timeout | 0
    isAutomatic: boolean
    createdAt: Date
    channelId: string | null
    alerted: boolean
    sendToDM: boolean
    interval: 0 | 1 | 2 | 3
    deleteAt?: Date
    messageId?: string
    disableComponents?: Date
    reminderIdToRemove?: string
}

export interface DiscordApplicationsMeRequest {
    id: string
    name: string
    message?: "401: Unauthorized" | "404: Unknown Application"
    icon: string | null
    description: string | null
    type: null
    bot: {
        id: string
        username: string
        avatar: string
        discriminator: string
        public_flags: number
        premium_type: number
        flags: number
        bot: boolean
        banner: string | null
        accent_color: number | null
        global_name: string | null
        avatar_decoration_data: string | null
        banner_color: number | null
    }
    summary: string
    guild_id: string
    bot_public: boolean
    bot_require_code_grant: boolean
    terms_of_service_url: string | null
    privacy_policy_url: string | null
    custom_install_url: string | null
    verify_key: string | null
    flags: number
    tags: string[] | null
    hook: boolean
    is_monetized: boolean
    redirect_uris: string[] | null
    interactions_endpoint_url: string | null
    role_connections_verification_url: string | null
    owner: {
        id: string
        username: string
        avatar: string | null
        discriminator: string | null
        public_flags: number
        premium_type: number
        flags: number
        banner: string | null
        accent_color: number
        global_name: string | null
        avatar_decoration_data: {
            asset: string | null
            sku_id: string | null
        }
        banner_color: string | null
    }
    approximate_guild_count: number
    interactions_event_types: string[]
    interactions_version: number
    explicit_content_filter: number
    rpc_application_state: number
    store_application_state: number
    creator_monetization_state: number
    verification_state: number
    integration_public: boolean
    integration_require_code_grant: boolean
    discoverability_state: number
    discovery_eligibility_flags: number
    monetization_state: number
    monetization_eligibility_flags: number
    team: null
}