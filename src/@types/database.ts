import { Types } from "mongoose";
import { ReminderType, TransactionsType } from "./commands";
import { Character } from "./quiz";

export interface WatchChange {
    operationType: "update" | "insert" | "delete" | "invalidate" | "drop"
    documentKey: {
        _id: Types.ObjectId
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
    _id: Types.ObjectId
    id: string
    email?: string
    Likes?: number
    Prefixes?: string[]
    locale?: string
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
    Stop: {
        categories: string[]
    }
    Tokens?: {
        access_token: string
        refresh_token: string
        expires_at: number
    }
    Timeouts?: {
        Bug: number
        Daily: number
        ImagesCooldown: number
        Loteria: number
        Cantada: number
        Bitcoin: number
        Porquinho: number
        TopGGVote: number
        Rep: number
        Reputation: number
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
    }
}

export interface GamingCount {
    FlagCount: number
    AnimeThemeCount: number
    QuizAnime: number
    Logomarca: number
    QuizQuestions: number
    Characters: Record<Character["category"] | "total", number>
}

export interface Vote {
    _id?: Types.ObjectId
    userId: string
    messageId: string
    channelId: string
    guildId: string
    messageUrl: string
    deleteAt: number
    enableReminder: boolean
}