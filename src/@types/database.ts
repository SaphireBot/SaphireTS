import { Types as MongoTypes } from "mongoose";
import { BlackjackData, ReminderType, TransactionsType } from "./commands";
import { Character } from "./quiz";
import { TwitchNotifications } from "./models";

export interface WatchChange {
    operationType: "update" | "insert" | "delete" | "invalidate" | "drop"
    documentKey: {
        _id: MongoTypes.ObjectId
    }
    _id: {
        _data: string
    }
    updateDescription?: {
        removeFields: string[],
        truncatedArrays: any[],
        updatedFields: Record<string, any>
    }
}

export interface WatchChangeCharacters extends WatchChange {
    fullDocument: Character
}

export interface WatchChangeReminder extends WatchChange {
    fullDocument: ReminderType | { id: string }
}

export interface User {
    _id: MongoTypes.ObjectId
    id: string
    createdAt: Date | null,
    updatedAt: Date | null,
    email?: string
    Likes?: number
    Prefixes?: string[]
    locale?: string
    QrCode: { name: string, content: string }[],
    Marriage: {
        Spouse_id: string,
        Spouse: MongoTypes.ObjectId | null,
        Since: Date | null,
    } | null,
    Experience: {
        Xp: number
        Level: number
    }
    Xp?: number
    Level?: number
    Transactions?: TransactionsType[]
    Balance?: number
    AfkSystem?: string
    DailyCount?: number
    MixCount?: number
    QuizCount?: number
    CompetitiveMemoryCount?: number
    ForcaCount?: number
    GamingCount?: GamingCount
    Blackjack?: BlackjackData
    TopGGVotes?: number,
    Stop: {
        categories: string[]
    }
    Tokens?: {
        access_token: string
        refresh_token: string
        expires_at: number
    }
    Timeouts?: {
        Daily: number
        Bitcoin: number
        Porquinho: number
        TopGGVote: number
    }
    Perfil?: {
        Reputation: any[]
        Avatar: string
        Titulo: string
        Status: string
        Sexo: string
        Signo: string
        Aniversario: string
        Trabalho: string
        BalanceOcult: boolean
        Marry: {
            Conjugate: string
            StartAt: number
        }
        Bits: number
        Bitcoins: number
        Estrela: {
            Um: boolean
            Dois: boolean
            Tres: boolean
            Quatro: boolean
            Cinco: boolean
            Seis: boolean
        }
    }
    Vip?: {
        DateNow: number
        TimeRemaing: number
        Permanent: boolean
    }
    Walls?: {
        Bg: string[]
        Set: string
    }
    Jokempo?: {
        Wins: number
        Loses: number
        Draws: number
    }
}

export type GiveawayType = {
    MessageID: string
    GuildId: string
    Guild_Id_Ref: MongoTypes.ObjectId
    Prize: string
    Winners: number
    LauchDate?: number
    WinnersGiveaway: string[]
    Participants: string[]
    Emoji: string
    TimeMs: number
    DateNow: number
    ChannelId: string
    Actived: boolean
    MessageLink: string
    CreatedBy: string
    Sponsor: string | undefined
    AllowedRoles: string[]
    LockedRoles: string[]
    AllowedMembers: string[]
    LockedMembers: string[]
    RequiredAllRoles: boolean
    AddRoles: string[]
    MultipleJoinsRoles: { id: string, joins: number }[]
    MinAccountDays: number
    MinInServerDays: number
    color?: number
    requires?: string | null | undefined
}

export interface GamingCount {
    FlagCount: number
    AnimeThemeCount: number
    QuizAnime: number
    Logomarca: number
    QuizQuestions: number
    Characters: Record<Character["category"] | "total", number>
    QuizMembers: number
}

export interface Lotto {
    id: number
    users: string[]
}

export interface Vote {
    _id?: MongoTypes.ObjectId
    userId: string
    messageId: string
    channelId: string
    guildId: string
    messageUrl: string
    deleteAt: number
    enableReminder: boolean
}

export interface Guild {
    _id: MongoTypes.ObjectId
    id: string
    Giveaways: GiveawayType[]
    Prefixes: string[]
    Bans: { userId: string, unbanAt: Date }[]
    TempCall: {
        enable: boolean
        muteTime: boolean
        members: Record<string, number>
        membersMuted: Record<string, number>
    }
    Spam: {
        enabled: boolean
        ignoreChannels: string[]
        ignoreRoles: string[]
        filters: {
            capsLock: {
                enabled: boolean
                percent: number
            }
            messagesTimer: {
                enabled: boolean
                amount: number
                seconds: number
            },
            repeat: {
                enabled: boolean
            }
        }
    }
    Chest: boolean
    FirstSystem: boolean
    Autorole: string[]
    TwitchNotifications: TwitchNotifications[]
    MinDay: {
        days: number
        punishment: "kick" | "ban" | "warn"
    }
    LogSystem: {
        channel: string
        webhookUrl: string
        ban: {
            active: boolean
        }
        unban: {
            active: boolean
        }
        kick: {
            active: boolean
        }
        mute: {
            active: boolean
        }
        channels: {
            active: boolean
        }
        messages: {
            active: boolean
        }
        bot: {
            active: boolean
        }
        roles: {
            active: boolean
        }
    }
    XpSystem: {
        Canal: string
        Mensagem: string
    }
    Pearls: {
        limit: number,
        channelId: string
        emoji: string
        count: Record<string, number>
        timeout: Record<string, number>
    }
}