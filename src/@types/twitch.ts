export interface UserData {
    id: string
    login: string
    display_name: string
    type: string
    channelId: string | null | undefined
    broadcaster_type: string
    description: string
    profile_image_url: string
    offline_image_url: string
    view_count: number
    email: string
    created_at: string,
    followers: number | undefined
}

export interface GetChannelFollowers {
    total: number
    data: ChannelFollower[]
    pagination: {
        cursor: string
    }
}

export interface ChannelFollower {
    user_id: string
    user_name: string
    user_login: string
    followed_at: string
}

export interface AcceptData {
    streamer: string
    username: string
    channelId: string
    roleId?: string
    oldChannelId?: string | null | undefined
    message?: string
}

export interface NotifierData {
    channelId: string
    guildId: string
    notified: boolean
    roleId: string | undefined
    message: string | undefined
    streamer?: string
}

export interface TwitchClassData {
    streamers?: {
        list: string[]
        count: number
        online: string[]
        offline: string[]
    }
    guilds?: string[]
    notifications?: number
    requests_awaiting?: number
    requests_made_in_this_session?: number
}

export interface Clip {
    id: string
    url: string
    embed_url: string
    broadcaster_id: string
    broadcaster_name: string
    creator_id: string
    creator_name: string
    video_id: string
    game_id: string
    language: string
    title: string
    view_count: number,
    created_at: string
    thumbnail_url: string
    duration: number,
    vod_offset: number,
    is_featured: boolean
}