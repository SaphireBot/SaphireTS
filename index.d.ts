declare namespace NodeJS {
    interface ProcessEnv {
        TOP_GG_AUTHORIZATION: string
        TOP_GG_TOKEN: string
        WEBHOOK_ACCESS: string
        GET_COMMANDS_ACCESS: string
        COMMAND_ACCESS: string
        WEBSOCKET_SAPHIRE_API_LOGIN_PASSWORD: string
        WEBSOCKET_SAPHIRE_API_LOGIN_URL: string
        GUILDS_ACCESS: string
        PHRASES_ACCESS: string
        POST_MESSAGE: string
        ROUTE_TOP_GG: string
        ROUTE_SAPHIRE_TOP_GG: string
        ROUTE_SAPHIRE_COMMANDS: string
        ROUTE_SAPHIRE_GUILDS: string
        WEBHOOK_TOP_GG_COUNTER: string
        WEBHOOK_STATUS: string
        WEBHOOK_ANIME_SUPPORTER: string
        TOP_GG_WEBHOOK_AVATAR: string
        DB_LOGIN: string
        DB_CREDENTIALS: string
        CLIENT_ID: string
        CLIENT_SECRET: string
        SERVER_PORT: string
        APP_ID: string
        DISCLOUD_TOKEN: string
        DISCLOUD_APP_ID: string
        LOGIN_ACCESS: string
        WEBSOCKET_CONNECTION_AUTHORIZATION: string
        WEBSOCKET_URL: string
        SAPHIRE_ID: string
        DISCORD_TOKEN: string
        DATABASE_LINK_CONNECTION: string
        CANARY_ID: string
        MACHINE: string
        CLIENT_SECRET: string
        CANARY_SECRET: string
        COOKIE_SECRET: string
        BOT_TOKEN_REQUEST: string
        DISCLOUD_TOKEN: string
        STATCORD_TOKEN: string
        TOP_GG_TOKEN: string
        TOP_GG_ACCESS: string
        MERCADO_PAGO_TOKEN: string
        GET_DATA_AUTHORIZATION: string
        COMMAND_ACCESS: string
        COMMIT_AUTHORIZATION: string
        GET_BACKUP_ZIP: string
        CHAT_GPT_KEY: string
        GERENCIA_NET_CLIENT_ID: string
        GERENCIA_NET_CLIENT_SECRET: string
        SPOTIFY_TOKEN: string
        SPOTIFY_CLIENT_ID: string
        SPOTIFY_CLIENT_SECRET: string
        DATABASE_PASSWORD_ACCESS: string
        DATABASE_USER_ACCESS: string
        WEBHOOK_SENDER_AUTHORIZATION: string
        WEBHOOK_DATABASE_LOGS: string
        WEBHOOK_ERROR_REPORTER: string
        WEBHOOK_DATABASE_PACKAGE: string
        WEBHOOK_ANIME_WALLPAPERS: string
        WEBHOOK_STATUS: string
        WEHBHOOK_SYSTEM_AVATAR: string
        WEBHOOK_GSN_AVATAR: string
        WEBHOOK_CANTADAS_URL: string
        ROUTE_BASE_DOMAIN: string
        ROUTE_GENERAL: string
        ROUTE_TOP_GG: string
        ROUTE_COMMANDS: string
        ROUTE_DATABASE: string
        ROUTE_RANKING: string
        ROUTE_WEBHOOK_SENDER: string
        ROUTE_LINKED_ROLES_CALLBACK: string
        ROUTE_LINKED_ROLES: string
        ROUTE_USERS_FROM_DATABASE: string
        ROUTE_GET_USERS_FROM_DATABASE_PASSWORD: string
        ROUTE_ANIMES_FROM_DATABASE: string
        ROUTE_CANTADAS_FROM_DATABASE: string
        ROUTE_CLIENTS_FROM_DATABASE: string
        ROUTE_ECONOMIES_FROM_DATABASE: string
        ROUTE_FANARTS_FROM_DATABASE: string
        ROUTE_GUILDS_FROM_DATABASE: string
        ROUTE_INDICATIONS_FROM_DATABASE: string
        ROUTE_MEMES_FROM_DATABASE: string
        ROUTE_RATHERS_FROM_DATABASE: string
        ROUTE_REMINDERS_FROM_DATABASE: string
        ROUTE_USERS_FROM_DATABASE: string
        ROUTE_GET_DATA_FROM_DATABASE_PASSWORD: string
        TWITCH_CLIENT_ID: string
        TWITCH_CLIENT_SECRET: string
        YOUTUBE_API_KEY: string
    }
}

interface DateConstructor {
    stringDate(ms: number, withMilliseconds?: boolean, locale: import("discord.js").LocaleString): string | undefined;
    format(DateInMs: number, locale: import("discord.js").LocaleString | undefined, Shorted?: boolean, withDateNow?: boolean): string
}

interface Number {
    currency(doNotsubstring?: boolean): string
}

interface String {
    emoji(): import("discord.js").APIMessageComponentEmoji
    limit(option:
        "MessageEmbedTitle"
        | "MessageEmbedDescription"
        | "MessageEmbedFields"
        | "MessageEmbedFieldName"
        | "MessageEmbedFieldValue"
        | "MessageEmbedFooterText"
        | "MessageEmbedAuthorName"
        | "MessageContent"
        | "AutocompleteName"
        | "AutocompleteValue"
        | "SelectMenuLabel"
        | "SelectMenuPlaceholder"
        | "SelectMenuDescription"
        | "SelectMenuValue"
        | "ButtonLabel"
        | number
    ): string
}

interface Array<T> {
    asComponents(): (
        | JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>
        | ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>
        | APIActionRowComponent<APIMessageActionRowComponent>
    )[]
    random(): T
    random(amount: 1): T
    random(amount: number): T[]
    random(amount: number, repeat: boolean): T[]
}