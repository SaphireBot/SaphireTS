export interface GiveawayType {
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

export interface TwitchNotifications {
    streamer: string
    channelId: string
    guildId: string
    message: string | undefined
    roleId: string | undefined
}
