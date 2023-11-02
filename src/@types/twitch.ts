
export interface UserData {
    id: string
    login: string
    display_name: string
    type: string
    channelId?: string
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
    oldChannelId?: string
    message?: string
}

export interface NotifierData {
    channelId: string
    guildId: string
    notified: boolean
    roleId: string | undefined
    message: string | undefined
}