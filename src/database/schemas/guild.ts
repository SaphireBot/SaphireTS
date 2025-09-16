import { Schema, InferSchemaType, Types } from "mongoose";

export const GuildSchema = new Schema({
    id: { type: String, unique: true },
    Prefixes: [String],
    Bans: [{ userId: String, unbanAt: Date }],
    TempCall: {
        enable: Boolean,
        muteTime: Boolean,
        members: Object,
        membersMuted: Object,
    },
    Spam: {
        enabled: { type: Boolean, default: false },
        ignoreChannels: { type: Array, default: [] },
        ignoreRoles: { type: Array, default: [] },
        filters: {
            capsLock: {
                enabled: { type: Boolean, default: false },
                percent: { type: Number, default: 0, max: 100, min: 0 },
            },
            messagesTimer: {
                enabled: { type: Boolean, default: false },
                amount: { type: Number, default: 3 },
                seconds: { type: Number, default: 2 },
            },
            repeat: {
                enabled: { type: Boolean, default: false },
            },
        },
    },
    ChannelsCommandBlock: [String],
    Chest: { type: Boolean, default: true },
    Moeda: String,
    FirstSystem: Boolean,
    SayCommand: { type: Boolean, default: true },
    AutoPublisher: Boolean,
    Autorole: [String],
    TwitchNotifications: [{
        streamer: String,
        channelId: String,
        guildId: String,
        message: String || undefined,
        roleId: String || undefined,
    }],
    MinDay: {
        days: Number,
        punishment: String, // Kick | Ban | Warn
    },
    announce: {
        channel: String,
        allowedRole: String,
        notificationRole: String,
        crosspost: Boolean,
    },
    Logs: {
        GSN: {
            channelId: String,
            active: Boolean,
        },
        ban: {
            channelId: String,
            active: Boolean,
            ban: Boolean,
            unban: Boolean,
        },
        kick: {
            channelId: String,
            active: Boolean,
        },
        mute: {
            channelId: String,
            active: Boolean,
        },
        channels: {
            channelId: String,
            active: Boolean,
        },
        messages: {
            channelId: String,
            active: Boolean,
            messageUpdate: Boolean,
            messageDelete: Boolean,
            messageDeleteBulk: Boolean,
            messageReactionRemoveAll: Boolean,
            messageReactionRemoveEmoji: Boolean,
        },
        bots: {
            channelId: String,
            active: Boolean,
        },
        roles: {
            channelId: String,
            active: Boolean,
        },
    },
    XpSystem: {
        Canal: String,
        Mensagem: String,
    },
    LeaveNotification: {
        channelId: String,
        active: Boolean,
        thumbnailImage: Boolean,
        body: {
            embed: Object,
            content: String,
        },
    },
    WelcomeNotification: {
        channelId: String,
        active: Boolean,
        thumbnailImage: Boolean,
        body: {
            embed: Object,
            content: String,
        },
    },
    Pearls: {
        limit: Number,
        channelId: String,
        sended: Array,
        emoji: String,
        count: Object,
        timeout: Object,
    },
});

export type GuildSchemaType = InferSchemaType<typeof GuildSchema> & { _id: Types.ObjectId };