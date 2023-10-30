
export interface UserData {
    id: string
    login: string
    display_name: string
    type: string
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