import {
    APIRole,
    APIActionRowComponent,
    APIApplicationCommand,
    APIEmbed,
    APIComponentInMessageActionRow,
    APIModalInteractionResponseCallbackData,
    APIUser,
    ActionRowData,
    ApplicationCommand,
    ChatInputCommandInteraction,
    ContextMenuCommandType,
    GuildResolvable,
    JSONEncodable,
    LocalizationMap,
    Message,
    MessageActionRowComponentBuilder,
    MessageActionRowComponentData,
    MessageContextMenuCommandInteraction,
    ModalComponentData,
    Permissions,
    Role,
    UserContextMenuCommandInteraction,
} from "discord.js";
import { Types } from "mongoose";

export interface PrefixCommandType {
    name: string
    description: string
    category: string
    aliases: string[]
    api_data: Command_Api_Data
    building?: boolean
    execute: (message: Message, args: string[], commandName?: string) => Promise<void>
}

export type appCommand = ApplicationCommand<{ guild: GuildResolvable }>;

export interface NewApplicationCommand extends APIApplicationCommand {
    integration_types?: number[]
    contexts?: number[]
}

export interface SlashCommandType {
    data: NewApplicationCommand
    additional: {
        category: string
        dm_permission: boolean
        database: boolean
        admin: boolean
        staff: boolean
        building?: boolean
        api_data: Command_Api_Data
        execute: (interaction: ChatInputCommandInteraction, ...args: any) => Promise<void>
    }
}

export interface APIApplicationContextMenuCommand {
    id: string
    name: string
    name_localizations?: LocalizationMap
    type: ContextMenuCommandType
    default_member_permissions: Permissions | null | undefined
    dm_permission: boolean | undefined
}

export interface NewAPIApplicationContextMenuCommand extends APIApplicationContextMenuCommand {
    integration_types?: number[]
    contexts?: number[]
    nsfw?: boolean
}

export interface ContextMenuBody {
    data: NewAPIApplicationContextMenuCommand
    additional: {
        category: string
        dm_permission: boolean
        database: boolean
        admin: boolean
        staff: boolean
        building?: boolean
        api_data: Command_Api_Data
        execute: (interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction) => Promise<void>
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
    | JSONEncodable<APIActionRowComponent<APIComponentInMessageActionRow>>
    | ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>
    | APIActionRowComponent<APIComponentInMessageActionRow>
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
    mode: "pay"
    | "crash"
    | "jokempo"
    | "system"
    | "daily"
    | "vote"
    | "race"
    | "bitcoin"
    | "admin"
    | "glass"
    | "blackjack"
    | "pig"
    | "bicho"
    | "lotto"
    | "chest"
    | "battleroyale"
    userIdentify?: string;
    keywordTranslate: "jokempo.transactions.gain"
    | "jokempo.transactions.loss"
    | "jokempo.transactions.gain_global"
    | "jokempo.transactions.loss_global"
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
    | "vote.transactions.voted"
    | "race.transactions.join"
    | "race.transactions.refund"
    | "race.transactions.win"
    | "bitcoin.transactions.gain"
    | "admin.transactions.add"
    | "admin.transactions.remove"
    | "admin.transactions.set"
    | "mercadopago.transactions.approved"
    | "glass.transactions.gain"
    | "glass.transactions.loss"
    | "glass.transactions.refund"
    | "blackjack.transactions.gain"
    | "blackjack.transactions.loss"
    | "blackjack.transactions.refund"
    | "pig.transactions.lose"
    | "pig.transactions.win"
    | "bicho.transactions.gain"
    | "bicho.transactions.loss"
    | "bicho.transactions.refund"
    | "lotto.transactions.gain"
    | "lotto.transactions.loss"
    | "chest.transactions.gain"
    | "battleroyale.transactions.gain"
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
    }
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
    guildId: string
    channelId: string
    value: number
    message: Message<boolean>
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
    ]
    monitoring_at: null
    name: string
    page_id: string
    resolved_at: string | null
    scheduled_for: string | null
    scheduled_until: string | null
    shortlink: string | null
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

export interface BlacklistData {
    _id?: string
    __v?: string
    id: string
    type: "user" | "guild" | "economy"
    removeIn?: Date
    addedAt: Date
    staff: string
    reason: string
}

export interface DiscloudStatusResponse {
    status: "ok" | "error"
    message: string
    apps: {
        id: string
        container: string
        cpu: string
        memory: string
        ssd: string
        netIO: {
            down: string
            up: string
        }
        last_restart: string
        startedAt: Date
    }
}

export enum ReminderTypeNumber {
    Automic = 0,
    Daily = 1,
    Weekly = 2,
    Monthly = 3
}

export type JokempoEmojis = "👊" | "🤚" | "✌️";
export type JokempoNames = "stone" | "paper" | "scissors";

export interface KitsuApiEdgeResult {
    data: KitsuApiEdgeAnime[] | KitsuApiEdgeManga[]
    meta: {
        count: number
    }
    links: {
        first: string
        prev?: string
        next?: string
        last: string
    }
}

export interface KitsuApiEdgeAnime {
    id: string
    type: "anime"
    links: {
        self: string
    }
    attributes: {
        createdAt: string
        updatedAt: string
        slug: string
        synopsis: string
        description: string
        coverImageTopOffset: number
        titles: {
            en: string
            en_jp: string
            ja_jp: string
        }
        canonicalTitle: string
        abbreviatedTitles: string[]
        averageRating: string
        ratingFrequencies: Record<string, string>
        userCount: number
        favoritesCount: number
        startDate: string
        endDate: string
        nextRelease: string | null
        popularityRank: number
        ratingRank: number
        age: number
        ageRating: "G" | "PG" | "R" | "R18"
        ageRatingGuide: string
        subtype: "ONA" | "OVA" | "TV" | "movie" | "music" | "special"
        status: "current" | "finished" | "tba" | "unreleased" | "upcoming"
        tba: string | null
        posterImage: KitsuPosterImage
        coverImage: KitsuCoverImage
        episodeCount: number
        episodeLength: number
        totalLength: number
        youtubeVideoId: string
        nsfw: boolean
    }
    relationships: KitsuRelationships
}

export interface KitsuApiEdgeManga {
    id: string
    type: "manga"
    links: {
        self: string
    }
    attributes: {
        createdAt: string
        updatedAt: string
        slug: string
        synopsis: string
        description: string
        coverImageTopOffset: number
        titles: {
            en: string | null
            en_jp: string | null
            ja_jp: string | null
        }
        canonicalTitle: string
        abbreviatedTitles: string[]
        averageRating: string
        ratingFrequencies: Record<string, string>
        userCount: number
        favoritesCount: number
        startDate: string | null
        endDate: string | null
        nextRelease: string | null
        popularityRank: number
        ratingRank: number
        age: number
        ageRating: sourceAgeRating
        ageRatingGuide: string | null
        subtype: sourceType
        status: sourceStatus
        tba: string | null
        posterImage: KitsuPosterImage
        coverImage: KitsuCoverImage
        chapterCount: number
        volumeCount: number
        serialization: string | null
        mangaType: sourceType
    }
}

type sourceType = "doujin" | "string" | "manga" | "string" | "manhua" | "string" | "manhwa" | "string" | "novel" | "string" | "oel" | "string" | "oneshot";
type sourceStatus = "current" | "string" | "finished" | "string" | "tba" | "string" | "unreleased" | "string" | "upcoming";
type sourceAgeRating = "G" | "PG" | "R" | "R18";

export interface KitsuAnimeData {
    data: {
        id: string
        type: string
        links: {
            self: string
        }
        attributes: {
            createdAt: string
            updatedAt: string
            slug: string
            synopsis: string
            description: string
            coverImageTopOffset: number
            titles: {
                en: string
                en_jp: string
                ja_jp: string
            }
            canonicalTitle: string
            abbreviatedTitles: string[]
            averageRating: string
            ratingFrequencies: Record<string, string>
            userCount: string
            favoritesCount: string
            startDate: string
            endDate: string
            nextRelease: string | null
            popularityRank: string
            ratingRank: string
            ageRating: sourceAgeRating
            ageRatingGuide: string
            subtype: string | null
            status: sourceStatus
            tba: string | null
            posterImage: KitsuPosterImage
            coverImage: KitsuCoverImage
            episodeCount: number
            episodeLength: number
            totalLength: number
            youtubeVideoId: string | null
            showType: string
            nsfw: false
        }
    }
}

export type CollectorReasonEnd = "time" | "limit" | "idle" | "user" | "channelDelete" | "messageDelete" | "guildDelete";

export interface GlassData {
    authorId?: string
    players?: string[]
    lives?: Record<string, number>
    guildId?: string | null
    channelId: string
    playingNowId?: string
    userUnderAttackId?: string
    glasses_taken?: Record<string, number>
    glasses_given?: Record<string, number>
    giveUpUsers?: string[]
    started?: boolean
    lastMessageId?: string
    numOfGlasses?: number
    value?: number
}

export type BlackjackCard = { value: number, emoji: string };
export interface BlackjackData {
    authorId?: string
    players?: string[]
    points?: Record<string, number>
    guildId?: string
    channelId?: string
    playingNowId?: string
    started?: boolean
    lastMessageId?: string
    decksAmount?: number
    indexToWhoWillPlayNow?: number
    standed?: string[]
    playerCards?: Record<string, BlackjackCard[]>
    deck?: BlackjackCard[]
    value?: number
}

export interface TeamsData {
    roles: string[]
    authorId: string
    participants: string[]
    teams: Record<string, string[]>
    limit: number
}

export interface GoogleImagesResultItems {
    kind: string
    title: string
    htmlTitle: string
    link: string
    displayLink: string
    snippet: string
    htmlSnippet: string
    mime: string
    fileFormat: string
    image: {
        contextLink: string
        height: number
        width: number
        byteSize: number
        thumbnailLink: string
        thumbnailHeight: number
        thumbnailWidth: number
    }
}

export interface GoogleImagesResult {
    items: GoogleImagesResultItems[]
}

export interface EliminationCache {
    players: Record<string, number>
    playSequency: Record<number, string>
    playNowIndex: number
    eliminated: Record<string, number>
    embed: APIEmbed,
    clicks: number[]
}

export interface APIApplicationEmojis {
    items: ApplicationEmoji[] // 2.000 itens max
}

export interface ApplicationEmoji {
    id: string
    name: string
    user: APIUser
    roles: APIRole[]
    require_colons: boolean
    managed: boolean
    animated: boolean
    available: boolean
}

export interface KitsuTrendingResponse {
    data: KitsuTrendingItem[]
}

export interface KitsuTrendingItem {
    id: string
    type: string
    links: {
        self: string
    },
    "attributes": {
        createdAt: string
        updatedAt: string
        slug: string
        synopsis: string
        description: string
        coverImageTopOffset: number
        titles: {
            en: string
            en_jp: string
            ja_jp: string
        },
        canonicalTitle: string
        abbreviatedTitles: string[],
        averageRating: string
        ratingFrequencies: {
            2: string
            3: string
            4: string
            5: string
            6: string
            7: string
            8: string
            9: string
            10: string
            11: string
            12: string
            13: string
            14: string
            15: string
            16: string
            17: string
            18: string
            19: string
            20: string
        },
        userCount: string
        favoritesCount: string
        startDate: string | null
        endDate: string | null
        nextRelease: string | null
        popularityRank: string
        ratingRank: string
        ageRating: "G" | "PG" | "R" | "R18"
        ageRatingGuide: string
        subtype: "ONA" | "OVA" | "TV" | "movie" | "music" | "special"
        status: "current" | "finished" | "tba" | "unreleased" | "upcoming"
        tba: string
        posterImage: KitsuPosterImage
        coverImage: KitsuCoverImage
        episodeCount: number
        episodeLength: number
        totalLength: number
        youtubeVideoId: string
        showType: string
        nsfw: boolean
    },
    relationships: KitsuRelationships
}

export interface KitsuCoverImage {
    tiny: string | null
    large: string | null
    small: string | null
    original: string | null
    meta: {
        dimensions: {
            tiny: KitsuImageDetails
            large: KitsuImageDetails
            small: KitsuImageDetails
        }
    }
}

export interface KitsuImageDetails {
    width: number,
    height: number
}

export interface KitsuPosterImage {
    tiny: string | null
    large: string | null
    small: string | null
    medium: string | null
    original: string | null
    meta: {
        dimensions: {
            tiny: {
                width: number
                height: number
            }
            large: {
                width: number
                height: number
            }
            small: {
                width: number
                height: number
            }
            medium: {
                width: number
                height: number
            }
        }
    }
}

export interface KitsuRelationships {
    genres: {
        links: {
            self: string
            related: string
        }
    }
    categories: {
        links: {
            self: string
            related: string
        }
    }
    castings: {
        links: {
            self: string
            related: string
        }
    }
    installments: {
        links: {
            self: string
            related: string
        }
    }
    mappings: {
        links: {
            self: string
            related: string
        }
    }
    reviews: {
        links: {
            self: string
            related: string
        }
    }
    mediaRelationships: {
        links: {
            self: string
            related: string
        }
    }
    characters: {
        links: {
            self: string
            related: string
        }
    }
    staff: {
        links: {
            self: string
            related: string
        }
    }
    productions: {
        links: {
            self: string
            related: string
        }
    }
    quotes: {
        links: {
            self: string
            related: string
        }
    }
    episodes: {
        links: {
            self: string
            related: string
        }
    }
    streamingLinks: {
        links: {
            self: string
            related: string
        }
    }
    animeProductions: {
        links: {
            self: string
            related: string
        }
    }
    animeCharacters: {
        links: {
            self: string
            related: string
        }
    }
    animeStaff: {
        links: {
            self: string
            related: string
        }
    }
}

export interface JikanImages {
    jpg: {
        image_url: string | null
        small_image_url: string | null
        large_image_url: string | null
    },
    webp: {
        image_url: string | null
        small_image_url: string | null
        large_image_url: string | null
    }
}

export interface JikanTopAnimeData {
    mal_id: number
    url: string
    images: JikanImages
    trailer: {
        youtube_id: string
        url: string | null
        embed_url: string
        images: {
            image_url: string
            small_image_url: string
            medium_image_url: string
            large_image_url: string
            maximum_image_url: string
        }
    }
    approved: boolean
    titles: { type: string, title: string }[]
    title: string
    title_english: string
    title_japanese: string
    title_synonyms: string[]
    type: string
    source: string
    episodes: number
    status: string
    airing: boolean
    aired: {
        from: string
        to: string
        prop: {
            from: {
                day: number
                month: number
                year: number
            },
            to: {
                day: number
                month: number
                year: number
            }
        },
        string: string
    },
    duration: string
    rating: string
    score: number
    scored_by: number
    rank: number
    popularity: number
    members: number
    favorites: number
    synopsis: string
    background: string
    season: string
    year: number
    broadcast: {
        day: string
        time: string
        timezone: string
        string: string
    }
    producers: { mal_id: number, type: string, name: string, url: string }[]
    licensors: {
        mal_id: number
        type: string
        name: string
        url: string
    }[]
    studios: {
        mal_id: number
        type: string
        name: string
        url: string
    }[]
    genres: {
        mal_id: number
        type: string
        name: string
        url: string
    }[]
    explicit_genres: undefined
    themes: undefined
    demographics: {
        mal_id: number
        type: string
        name: string
        url: string
    }[]
}

export interface JikanTopAnimeResponse {
    pagination: {
        last_visible_page: number
        has_next_page: boolean
        current_page: number
        items: {
            count: number
            total: number
            per_page: number
        }
    }
    data: JikanTopAnimeData[]
}

export interface JikanDataRecomendationEntry {
    mal_id: number
    url: string
    images: JikanImages
    title: string
}

export interface JikanDataRecomendation {
    mal_id: string
    entry: JikanDataRecomendationEntry[]
    content: string
    date: string
    user: {
        url: string
        username: string
    }
}

export interface JikanBaseDataInfo {
    mal_id: number
    type: string
    name: string
    url: string
}

export interface JikanRecomendationResponse {
    pagination: {
        last_visible_page: number,
        has_next_page: boolean
    },
    data: JikanDataRecomendation[]
}

export interface JikanGetAnimeFullByIdResponse {
    data: {
        mal_id: number
        url: string
        images: JikanImages
        trailer: {
            youtube_id: string
            url: string | null
            embed_url: string
            images: {
                image_url: string
                small_image_url: string
                medium_image_url: string
                large_image_url: string
                maximum_image_url: string
            }
        },
        approved: boolean
        titles: { type: string, title: string }[]
        title: string
        title_english: string
        title_japanese: string
        title_synonyms: string[]
        type: string
        source: string
        episodes: number
        status: string
        airing: boolean
        aired: {
            from: string
            to: string | null,
            prop: {
                from: {
                    day: number | null
                    month: number | null
                    year: number | null
                },
                to: {
                    day: number | null
                    month: number | null
                    year: number | null
                }
            },
            string: string
        },
        duration: string
        rating: string
        score: string
        scored_by: string
        rank: string
        popularity: string
        members: string
        favorites: string
        synopsis: string
        background: string
        season: string
        year: number
        broadcast: {
            day: string
            time: string
            timezone: string
            string: string
        },
        producers: JikanBaseDataInfo[]
        licensors: JikanBaseDataInfo[]
        studios: JikanBaseDataInfo[]
        genres: JikanBaseDataInfo[]
        explicit_genres: [],
        themes: [],
        demographics: JikanBaseDataInfo[]
        relations: [
            {
                relation: string
                entry: JikanBaseDataInfo[]
            }
        ]
        theme: {
            openings: string[]
            endings: string[]
        }
        external: { name: string, url: string }[]
        streaming: { name: string, url: string }[]
    }
}

export interface TicTacToeDataGame {
    players: string[]
    opponent: string
    author: string
    whoPlayNow: string
    emoji: Record<string, string>,
}