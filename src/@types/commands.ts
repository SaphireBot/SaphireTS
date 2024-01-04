import {
    APIActionRowComponent,
    APIApplicationCommand,
    APIMessageActionRowComponent,
    APIModalInteractionResponseCallbackData,
    ActionRowData,
    ChatInputCommandInteraction,
    JSONEncodable,
    Message,
    MessageActionRowComponentBuilder,
    MessageActionRowComponentData,
    ModalComponentData,
    Role,
    Snowflake
} from "discord.js";
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
    mode: "pay" | "crash" | "jokempo" | "system" | "daily" | "vote" | "race" | "bitcoin" | "admin"
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
        },
        last_restart: string
        startedAt: Date
    }
}

// TODO: Apenas um lembrete
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
        },
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
        tba: string | null,
        posterImage: {
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
                    },
                    large: {
                        width: number
                        height: number
                    },
                    small: {
                        width: number
                        height: number
                    },
                    medium: {
                        width: number
                        height: number
                    }
                }
            }
        }
        coverImage: {
            tiny: string | null
            large: string | null
            small: string | null
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
                }
            }
        }
        episodeCount: number
        episodeLength: number
        totalLength: number
        youtubeVideoId: "j2hiC9BmJlQ",
        nsfw: boolean
    },
    relationships: {
        "genres": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/genres",
                "related": "https://kitsu.io/api/edge/anime/11/genres"
            }
        },
        "categories": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/categories",
                "related": "https://kitsu.io/api/edge/anime/11/categories"
            }
        },
        "castings": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/castings",
                "related": "https://kitsu.io/api/edge/anime/11/castings"
            }
        },
        "installments": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/installments",
                "related": "https://kitsu.io/api/edge/anime/11/installments"
            }
        },
        "mappings": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/mappings",
                "related": "https://kitsu.io/api/edge/anime/11/mappings"
            }
        },
        "reviews": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/reviews",
                "related": "https://kitsu.io/api/edge/anime/11/reviews"
            }
        },
        "mediaRelationships": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/media-relationships",
                "related": "https://kitsu.io/api/edge/anime/11/media-relationships"
            }
        },
        "characters": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/characters",
                "related": "https://kitsu.io/api/edge/anime/11/characters"
            }
        },
        "staff": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/staff",
                "related": "https://kitsu.io/api/edge/anime/11/staff"
            }
        },
        "productions": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/productions",
                "related": "https://kitsu.io/api/edge/anime/11/productions"
            }
        },
        "quotes": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/quotes",
                "related": "https://kitsu.io/api/edge/anime/11/quotes"
            }
        },
        "episodes": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/episodes",
                "related": "https://kitsu.io/api/edge/anime/11/episodes"
            }
        },
        "streamingLinks": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/streaming-links",
                "related": "https://kitsu.io/api/edge/anime/11/streaming-links"
            }
        },
        "animeProductions": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/anime-productions",
                "related": "https://kitsu.io/api/edge/anime/11/anime-productions"
            }
        },
        "animeCharacters": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/anime-characters",
                "related": "https://kitsu.io/api/edge/anime/11/anime-characters"
            }
        },
        "animeStaff": {
            "links": {
                "self": "https://kitsu.io/api/edge/anime/11/relationships/anime-staff",
                "related": "https://kitsu.io/api/edge/anime/11/anime-staff"
            }
        }
    }
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
        abbreviatedTitles: string[],
        averageRating: string,
        ratingFrequencies: Record<string, string>
        userCount: number
        favoritesCount: number
        startDate: string | null
        endDate: string | null
        nextRelease: string | null
        popularityRank: number
        ratingRank: number
        age: number
        ageRating: "G" | "PG" | "R" | "R18"
        ageRatingGuide: string | null,
        subtype: "doujin" | "string" | "manga" | "string" | "manhua" | "string" | "manhwa" | "string" | "novel" | "string" | "oel" | "string" | "oneshot"
        status: "current" | "string" | "finished" | "string" | "tba" | "string" | "unreleased" | "string" | "upcoming"
        tba: string | null
        posterImage: {
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
                    },
                    large: {
                        width: number
                        height: number
                    },
                    small: {
                        width: number
                        height: number
                    },
                    medium: {
                        width: number
                        height: number
                    }
                }
            }
        }
        coverImage: {
            tiny: string | null
            large: string | null
            small: string | null
            original: string | null
            meta: {
                dimensions: {
                    tiny: {
                        width: number
                        height: number
                    },
                    large: {
                        width: number
                        height: number
                    },
                    small: {
                        width: number
                        height: number
                    }
                }
            }
        }
        chapterCount: number
        volumeCount: number
        serialization: string | null
        mangaType: "doujin" | "string" | "manga" | "string" | "manhua" | "string" | "manhwa" | "string" | "novel" | "string" | "oel" | "string" | "oneshot"
    }
}

export interface KitsuAnimeData {
    "data": {
        "id": "41240",
        "type": "anime",
        "links": {
            "self": "https://kitsu.io/api/edge/anime/41240"
        },
        "attributes": {
            "createdAt": "2018-04-27T14:02:41.207Z",
            "updatedAt": "2024-01-04T00:28:26.530Z",
            "slug": "yagate-kimi-ni-naru",
            "synopsis": "Yuu has always dreamt of receiving a love confession but feels nothing when a boy gives her one. Confused, she starts her first year of high school and meets the beautiful student council president, Nanami, who makes her heart skip a beat.\n\n(Source: HIDIVE)",
            "description": "Yuu has always dreamt of receiving a love confession but feels nothing when a boy gives her one. Confused, she starts her first year of high school and meets the beautiful student council president, Nanami, who makes her heart skip a beat.\n\n(Source: HIDIVE)",
            "coverImageTopOffset": 0,
            "titles": {
                "en": "Bloom Into You",
                "en_jp": "Yagate Kimi ni Naru",
                "ja_jp": "やがて君になる"
            },
            "canonicalTitle": "Yagate Kimi ni Naru",
            "abbreviatedTitles": [
                "Eventually, I Will Become You"
            ],
            "averageRating": "79.19",
            "ratingFrequencies": {
                "2": "63",
                "3": "0",
                "4": "20",
                "5": "0",
                "6": "27",
                "7": "3",
                "8": "208",
                "9": "11",
                "10": "144",
                "11": "19",
                "12": "414",
                "13": "62",
                "14": "1413",
                "15": "164",
                "16": "1379",
                "17": "222",
                "18": "957",
                "19": "104",
                "20": "1351"
            },
            "userCount": 19966,
            "favoritesCount": 243,
            "startDate": "2018-10-05",
            "endDate": "2018-12-28",
            "nextRelease": null,
            "popularityRank": 798,
            "ratingRank": 878,
            "ageRating": "PG",
            "ageRatingGuide": "Teens 13 or older",
            "subtype": "TV",
            "status": "finished",
            "tba": "",
            "posterImage": {
                "tiny": "https://media.kitsu.io/anime/poster_images/41240/tiny.jpg",
                "large": "https://media.kitsu.io/anime/poster_images/41240/large.jpg",
                "small": "https://media.kitsu.io/anime/poster_images/41240/small.jpg",
                "medium": "https://media.kitsu.io/anime/poster_images/41240/medium.jpg",
                "original": "https://media.kitsu.io/anime/poster_images/41240/original.jpg",
                "meta": {
                    "dimensions": {
                        "tiny": {
                            "width": 110,
                            "height": 156
                        },
                        "large": {
                            "width": 550,
                            "height": 780
                        },
                        "small": {
                            "width": 284,
                            "height": 402
                        },
                        "medium": {
                            "width": 390,
                            "height": 554
                        }
                    }
                }
            },
            "coverImage": {
                "tiny": "https://media.kitsu.io/anime/cover_images/41240/tiny.jpg",
                "large": "https://media.kitsu.io/anime/cover_images/41240/large.jpg",
                "small": "https://media.kitsu.io/anime/cover_images/41240/small.jpg",
                "original": "https://media.kitsu.io/anime/cover_images/41240/original.jpg",
                "meta": {
                    "dimensions": {
                        "tiny": {
                            "width": 840,
                            "height": 200
                        },
                        "large": {
                            "width": 3360,
                            "height": 800
                        },
                        "small": {
                            "width": 1680,
                            "height": 400
                        }
                    }
                }
            },
            "episodeCount": 13,
            "episodeLength": 24,
            "totalLength": 312,
            "youtubeVideoId": "_yVedXph7Ig",
            "showType": "TV",
            "nsfw": false
        },
        "relationships": {
            "genres": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/genres",
                    "related": "https://kitsu.io/api/edge/anime/41240/genres"
                }
            },
            "categories": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/categories",
                    "related": "https://kitsu.io/api/edge/anime/41240/categories"
                }
            },
            "castings": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/castings",
                    "related": "https://kitsu.io/api/edge/anime/41240/castings"
                }
            },
            "installments": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/installments",
                    "related": "https://kitsu.io/api/edge/anime/41240/installments"
                }
            },
            "mappings": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/mappings",
                    "related": "https://kitsu.io/api/edge/anime/41240/mappings"
                }
            },
            "reviews": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/reviews",
                    "related": "https://kitsu.io/api/edge/anime/41240/reviews"
                }
            },
            "mediaRelationships": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/media-relationships",
                    "related": "https://kitsu.io/api/edge/anime/41240/media-relationships"
                }
            },
            "characters": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/characters",
                    "related": "https://kitsu.io/api/edge/anime/41240/characters"
                }
            },
            "staff": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/staff",
                    "related": "https://kitsu.io/api/edge/anime/41240/staff"
                }
            },
            "productions": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/productions",
                    "related": "https://kitsu.io/api/edge/anime/41240/productions"
                }
            },
            "quotes": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/quotes",
                    "related": "https://kitsu.io/api/edge/anime/41240/quotes"
                }
            },
            "episodes": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/episodes",
                    "related": "https://kitsu.io/api/edge/anime/41240/episodes"
                }
            },
            "streamingLinks": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/streaming-links",
                    "related": "https://kitsu.io/api/edge/anime/41240/streaming-links"
                }
            },
            "animeProductions": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/anime-productions",
                    "related": "https://kitsu.io/api/edge/anime/41240/anime-productions"
                }
            },
            "animeCharacters": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/anime-characters",
                    "related": "https://kitsu.io/api/edge/anime/41240/anime-characters"
                }
            },
            "animeStaff": {
                "links": {
                    "self": "https://kitsu.io/api/edge/anime/41240/relationships/anime-staff",
                    "related": "https://kitsu.io/api/edge/anime/41240/anime-staff"
                }
            }
        }
    }
}