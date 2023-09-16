import { APIMessage } from "discord.js";

export interface GuildModelType {
    id: string
    Giveaways?: GiveawayType[]
    Prefixes?: string[]
    TempCall?: {
        enable: boolean
        muteTime: boolean
        members: Record<string, number>[]
        membersMuted: Record<string, number>[]
    }
    Spam?: {
        enabled: boolean
        ignoreChannels: string[]
        ignoreRoles: string[]
        filters: {
            capsLock: {
                enabled: boolean
                percent: number
            },
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
    Chest?: boolean
    // Polls: Array,
    Moeda?: string
    FirstSystem?: boolean
    Autorole?: string[]
    CommandBlocks?: string[]
    TwitchNotifications?: TwitchNotifications[]
    MinDay?: {
        days: number
        punishment: "kick" | "ban" | "warn"
    }
    announce?: {
        channel: string
        allowedRole: string
        notificationRole: string
        crosspost: boolean
    }
    LogSystem?: {
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
        botAdd: {
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
    LeaveChannel: {
        channelId: string
        body?: {
            channelId?: string
            body?: APIMessage
        }
    }
    WelcomeChannel: {
        channelId: string
        body?: {
            channelId?: string
            body?: APIMessage
        }
    }
    Stars: {
        limit: number
        channel: string
        sended: string[]
    }
}

interface GiveawayType {
    MessageID: string
    GuildId: string
    Prize: string
    Winners: number
    WinnersGiveaway: string[]
    Participants: string[]
    Emoji: string
    TimeMs: number
    DateNow: number
    ChannelId: string
    Actived: boolean
    MessageLink: string
    CreatedBy: string
    Sponsor: string
    AllowedRoles: string[]
    LockedRoles: string[]
    AllowedMembers: string[]
    LockedMembers: string[]
    RequiredAllRoles: string[]
    AddRoles: string[]
    MultipleJoinsRoles: string[]
    MinAccountDays: number
    MinInServerDays: number
}

interface TwitchNotifications {
    streamer: string
    channelId: string
    guildId: string
    message: string | undefined
    roleId: string | undefined
}
