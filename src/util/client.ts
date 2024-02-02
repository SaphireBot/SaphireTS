import { GatewayIntentBits, Partials, ClientOptions, ActivityType } from "discord.js";

export const saphireClientOptions: ClientOptions = {
    // shards: [],
    closeTimeout: 2000,
    // shardCount: 1,
    // makeCache: (),
    allowedMentions: { parse: ["users", "roles"] },
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User
    ],
    failIfNotExists: false,
    presence: {
        status: "idle",
        afk: false,
        activities: [{ type: ActivityType.Watching, name: "Interestellar" }],
        // shardId: []
    },
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        // GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        // GatewayIntentBits.GuildWebhooks,
        // GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        // GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        // GatewayIntentBits.GuildMessageTyping,
        // GatewayIntentBits.GuildPresences // DISCORD, GIMME THE INTENT!!!!!!!!!!!!!!!!!!
    ],
    waitGuildTimeout: 20000,
    // sweepers: {
        // autoModerationRules: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => () => true,
        // },
        // applicationCommands: {
        //     interval: 0,
        //     filter: () => {}
        // },
        // bans: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => () => true,
        // },
        // emojis: {
        //     interval: 0,
        //     filter: () => {}
        // },
        // invites: {
        //     interval: 1000 * 60 * 5,
        //     //lifetime: 1000 * 60 * 60,
        //     filter: () => () => true,
        // },
        // guildMembers: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => () => true,
        // },
        // messages: {
        //     interval: 1000 * 60 * 5,
        //     // lifetime: 1000 * 60 * 60,
        //     filter: () => () => true,
        // },
        // presences: {
        //     interval: 0,
        //     filter: () => {}
        // },
        // reactions: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => () => true,
        // },
        // stageInstances: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => () => true,
        // },
        // stickers: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => () => true,
        // },
        // threadMembers: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => () => true,
        // },
        // threads: {
        //     interval: 1000 * 60 * 5,
        //     // lifetime: 0,
        //     filter: () => () => true,
        // },
        // users: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => true
        // },
        // voiceStates: {
        //     interval: 1000 * 60 * 5,
        //     filter: () => () => true,
        // }
    // },
    // ws: {
    // large_threshold: 50,
    // version: 10,
    // buildStrategy: () => { },
    // buildIdentifyThrottler : (manager) => { }
    // },
    // rest: { },
    // jsonTransformer: () => { }
};