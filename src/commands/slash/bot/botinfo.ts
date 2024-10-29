import { ApplicationCommandType, ButtonStyle, ButtonInteraction, ChatInputCommandInteraction, Colors, codeBlock, ComponentType, Message } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import T, { t } from "../../../translator";
import { DiscordApplicationsMeRequest, DiscloudStatusResponse } from "../../../@types/commands";
import { env } from "process";
import socket from "../../../services/api/ws";
import Database from "../../../database";
import { readFileSync } from "fs";
import { urls } from "../../../util/constants";
import handler from "../../../structures/commands/handler";

const availableLanguagesKeys = {
    "de": "german",
    "en-US": "english",
    "es-ES": "spanish",
    "fr": "french",
    "ja": "japanese",
    "pt-BR": "portuguese",
    "zh-CN": "chinese",
};
const packagejson = JSON.parse(readFileSync("./package.json", "utf-8"));

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
    data: {
        type: ApplicationCommandType.ChatInput,
        application_id: client.user?.id,
        guild_id: "",
        name: "botinfo",
        description: "[bot] A way to see my informations",
        description_localizations: getLocalizations("botinfo.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [],
    },
    additional: {
        category: "bot",
        admin: false,
        staff: false,
        api_data: {
            name: "botinfo",
            description: "Informações do bot",
            category: "Informações do bot",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: [],
            },
        },
        async execute(
            interaction: ChatInputCommandInteraction | ButtonInteraction | Message,
            commandData: { c: "botinfo", userId: string } | undefined,
        ) {

            const { userLocale: locale } = interaction;
            const user = "author" in interaction ? interaction.author : interaction.user;

            if (interaction instanceof ButtonInteraction)
                if (commandData?.userId !== user.id)
                    return await interaction.reply({
                        content: t("reminder.you_cannot_click_here", { e, locale }),
                        ephemeral: true,
                    });

            const msg = interaction instanceof ChatInputCommandInteraction
                ? await interaction.reply({ content: t("botinfo.loading", { e, locale }), embeds: [], components: [], fetchReply: true })
                : interaction instanceof ButtonInteraction
                    ? await interaction.update({ content: t("botinfo.loading", { e, locale }), embeds: [], components: [], files: [], fetchReply: true })
                    : await interaction.reply({ content: t("botinfo.loading", { e, locale }) });

            const data = await fetch(
                "https://discord.com/api/v10/applications/@me",
                { headers: { Authorization: `Bot ${client.token}` } },
            )
                .then(res => res.json())
                .catch(err => ({ message: err })) as DiscordApplicationsMeRequest | Error;

            if ("message" in data)
                return await reply({
                    content: t("botinfo.data_with_message", { e, locale, message: data.message }),
                });

            const twitch = await socket.twitch.getData();
            const clientData = await client.getData();
            const commandsData = await Database.Commands.find(
                {},
                "id count",
                {
                    sort: { count: -1 },
                    fields: "id count",
                },
            )
                .catch(() => []);

            const usedCommands = commandsData.map(doc => doc.toObject()).reduce((pre, curr) => pre + (curr.count || 0), 0).currency();

            const discloud = await fetch(`https://api.discloud.app/v2/app/${process.env.DISCLOUD_APP_ID}/status`, {
                headers: {
                    "api-token": process.env.DISCLOUD_TOKEN,
                },
            })
                .then(res => res.json())
                .catch(() => { }) as DiscloudStatusResponse;

            const payload: any = {
                content: null,
                embeds: [
                    {
                        color: Colors.Blue,
                        title: t("botinfo.embed.title", { e, locale }),
                        description: t("botinfo.embed.description", { e, locale, user: user.username, data }),
                        fields: [
                            {
                                name: t("botinfo.embed.fields.0.name", { locale, e }),
                                value: codeBlock(
                                    "TXT",
                                    t(
                                        "botinfo.embed.fields.0.value",
                                        {
                                            locale,
                                            shard: `${client.shardId}/${((client.shardStatus?.totalShards || 0) - 1).currency()}`,
                                            identification: data.name,
                                            guilds: (data.approximate_guild_count || 0).currency(),
                                            id: `(${client.user!.id})`,
                                            tags: (data.tags?.length || 0).currency(),
                                            events: "20+",
                                        },
                                    ),
                                ),
                                inline: true,
                            },
                            {
                                name: t("botinfo.embed.fields.1.name", { locale, e }),
                                value: codeBlock(
                                    "TXT",
                                    t(
                                        "botinfo.embed.fields.1.value",
                                        {
                                            locale,
                                            slash: handler.slashCommands.size.currency(),
                                            prefix: handler.prefixes.size.currency(),
                                            aliases: Array.from(handler.aliases.values()).reduce((pre, curr) => pre += curr.size, 0).currency(),
                                            base_prefix: "s! -",
                                            languages_support: 7,
                                            blocks: (clientData?.BlockedCommands?.length || 0).currency(),
                                        },
                                    ),
                                ),
                                inline: true,
                            },
                            {
                                name: t("botinfo.embed.fields.4.name", { e, locale }),
                                value: codeBlock(
                                    "TXT",
                                    t(
                                        "botinfo.embed.fields.4.value",
                                        {
                                            locale,
                                            commands: commandsData.slice(0, 5).map(cmd => `${t(`${cmd.id}.name`, locale)}: ${cmd.count}`.replace("name", cmd.id)).join("\n"),
                                            total: usedCommands,
                                        },
                                    ),
                                ),
                                inline: true,
                            },
                            {
                                name: t("botinfo.embed.fields.5.name", { locale, e }),
                                value: codeBlock(
                                    "TXT",
                                    t(
                                        "botinfo.embed.fields.5.value",
                                        {
                                            locale,
                                            streamers: {
                                                count: (twitch?.streamers?.count || 0).currency(),
                                                online: (twitch?.streamers?.online?.length || 0).currency(),
                                                offline: (twitch?.streamers?.offline?.length || 0).currency(),
                                            },
                                            guilds: (twitch?.guilds?.length || 0).currency(),
                                            notifications: (twitch?.notifications || 0).currency(),
                                            requests: (twitch?.requests_awaiting || 0).currency(),
                                            status: twitch ? "Online" : "Offline",
                                        },
                                    ),
                                ),
                                inline: true,
                            },
                            {
                                name: t("botinfo.embed.fields.6.name", locale),
                                value: codeBlock(
                                    "TXT",
                                    t(
                                        "botinfo.embed.fields.6.value",
                                        {
                                            locale,
                                            e,
                                            text: Object.entries(T.options.stats)
                                                .filter(opt => availableLanguagesKeys[opt[0] as keyof typeof availableLanguagesKeys])
                                                .map(([key, value]) => {
                                                    const language = t(
                                                        `keyword_language.${availableLanguagesKeys[key as keyof typeof availableLanguagesKeys]}`,
                                                        locale,
                                                    );

                                                    if (!language) return undefined;
                                                    return `${language}: ${value}% (${key})`;
                                                })
                                                .filter(Boolean)
                                                .join("\n"),
                                        },
                                    ),
                                ),
                                inline: true,
                            },
                            {
                                name: t("botinfo.embed.fields.2.name", { locale, e }),
                                value: codeBlock(
                                    "TXT",
                                    t(
                                        "botinfo.embed.fields.2.value",
                                        {
                                            locale,
                                            createdAt: client.user!.createdAt.toLocaleString(locale),
                                            ceo: `${data.owner.username} (${data.owner.id})`,
                                            team: "Saphire's Team",
                                            node: `Node.JS (${process.version})`,
                                            client_version: `${client.user!.id === env.SAPHIRE_ID ? "Saphire" : "Canary"} (${packagejson.version as string})`,
                                            library: `discord.js (${packagejson.dependencies["discord.js"]})`,
                                            host: client.shardStatus?.host || "localhost",
                                        },
                                    ),
                                ),
                                inline: false,
                            },
                            {
                                name: t("botinfo.embed.fields.3.name", locale),
                                value: codeBlock(
                                    "TXT",
                                    t(
                                        "botinfo.embed.fields.3.value",
                                        {
                                            locale,
                                            ping: `${client.ws.ping}ms`,
                                            online: Date.stringDate(client.uptime || 0, false, locale),
                                            interactions: client.interactions.currency(),
                                            messages: client.messages.currency(),
                                            emojis: ((Object.keys(e)?.length || 0) + 5).currency(), // (+5) Animated emojis inside "Animated" object
                                            commands: {
                                                used: usedCommands,
                                                since_online: Object.values(client.commandsUsed).reduce((pre, curr) => pre + curr, 0).currency(),
                                            },
                                        },
                                    ),
                                ),
                                inline: true,
                            },
                            {
                                name: t("botinfo.embed.fields.7.name", { e, locale }),
                                value: codeBlock(
                                    "TXT",
                                    t("botinfo.embed.fields.7.value", {
                                        locale,
                                        id: discloud?.apps?.id || "0",
                                        cpu: discloud?.apps?.cpu || "0",
                                        memory: discloud?.apps?.memory || "0",
                                        ssd: discloud?.apps?.ssd || "0",
                                        netIO: `↑ ${discloud?.apps?.netIO?.up || "0MB"} | ${discloud?.apps?.netIO?.down || "0MB"} ↓`,
                                    }),
                                ),
                                inline: true,
                            },
                        ],
                        footer: {
                            text: `Cluster ${client.clusterName} [${client.shardId}/${(client.shardStatus?.totalShards || 0) - 1}]` + ` - ${Date.stringDate(client.uptime || 0, false, locale)}`,
                        },
                    },
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: ComponentType.Button,
                                label: t("keyword_refresh", locale),
                                emoji: "🔄".emoji(),
                                custom_id: JSON.stringify({ c: "botinfo", userId: user.id }),
                                style: ButtonStyle.Primary,
                            },
                            {
                                type: ComponentType.Button,
                                label: "Ping",
                                emoji: "🏓".emoji(),
                                custom_id: JSON.stringify({ c: "ping", userId: user.id }),
                                style: ButtonStyle.Primary,
                            },
                            {
                                type: ComponentType.Button,
                                label: "Shards",
                                emoji: "🧩".emoji(),
                                custom_id: JSON.stringify({ c: "ping", src: "shard", userId: user.id }),
                                style: ButtonStyle.Primary,
                            },
                            {
                                type: ComponentType.Button,
                                label: t("keyword_status", locale),
                                emoji: "📊".emoji(),
                                url: urls.saphireSiteUrl + "/status",
                                style: ButtonStyle.Link,
                            },
                        ],
                    },
                ],
            };

            return await reply(payload);

            async function reply(payload: any) {
                if (interaction instanceof ChatInputCommandInteraction)
                    return await interaction.editReply(payload);

                return await msg.edit(payload);
            }
        },
    },
};