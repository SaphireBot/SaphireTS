import { Colors } from "discord.js";
import { GiveawayCollectorData } from "./commands";

export interface GiveawayType extends GiveawayCollectorData {
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
    AddRoles: string[]
    MultipleJoinsRoles: { id: string, joins: number }[]
    MinAccountDays: number
    MinInServerDays: number
    imageUrl?: string
    Requires?: string
    color?: (typeof Colors)[keyof typeof Colors],
    requires?: string
}

export interface TwitchNotifications {
    streamer: string
    channelId: string
    guildId: string
    message: string | undefined
    roleId: string | undefined
}
