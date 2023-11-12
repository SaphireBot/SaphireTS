import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, ButtonInteraction, ComponentType, Routes } from "discord.js";
import mongoose from "mongoose";
import { discloud } from "discloud.app";
import { e } from "../../../util/json";
import socket from "../../../services/api/ws/index";
import { env } from "process";
import client from "../../../saphire/index";
import { urls } from "../../../util/constants";
import { t } from "../../../translator";
import pingShard from "../../components/buttons/ping/shards.ping";
import { getLocalizations } from "../../../util/getlocalizations";

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
        name: "ping",
        name_localizations: {},
        description: "[bot] 🏓 Ping-Pong",
        description_localizations: getLocalizations("ping.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        options: [
            {
                name: "options",
                name_localizations: getLocalizations("ping.options.0.name"),
                description: "Opções do comando ping",
                description_localizations: getLocalizations("ping.options.0.description"),
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "Ping and Shards summary",
                        name_localizations: getLocalizations("ping.options.0.choices.0.name"),
                        value: "shard"
                    }
                ]
            }
        ]
    },
    additional: {
        database: false,
        category: "bot",
        admin: false,
        staff: false,
        api_data: {
            name: "ping",
            description: "Veja um resumo de todas as conexões da Saphire",
            category: "Saphire",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(
            interaction: ChatInputCommandInteraction | ButtonInteraction,
            commandData?: {
                c: "ping" | "botinfo" | "ping",
                src: "shard",
                userId: string
            }
        ) {

            const { userLocale: locale } = interaction;

            if (
                commandData?.userId
                && commandData?.userId !== interaction.user.id
                && interaction.isButton()
            )
                return await interaction.reply({
                    content: t("ping.you_cannot_click_here", {
                        e,
                        locale: locale,
                        username: interaction.message.interaction?.user?.username || t("ping.no_username_found", locale)
                    }),
                    ephemeral: true
                });

            const toRefresh = commandData?.c;
            if (commandData?.src === "shard") return await pingShard(interaction, null, commandData);

            if (!toRefresh && interaction.isChatInputCommand())
                if (interaction.options.getString("options") === "shard") return pingShard(interaction, null, { c: "ping", src: "shard", userId: interaction.user.id });

            toRefresh && interaction.isButton()
                ? await interaction.update({
                    fetchReply: true,
                    components: [{
                        type: 1,
                        components: [
                            {
                                type: ComponentType.Button,
                                label: t("keyword_loading", locale),
                                emoji: e.Loading.emoji(),
                                custom_id: "refreshing",
                                style: ButtonStyle.Primary,
                                disabled: true
                            },
                            {
                                type: ComponentType.Button,
                                label: t("keyword_status", locale),
                                emoji: "📊".emoji(),
                                url: urls.saphireSiteUrl + "/status",
                                style: ButtonStyle.Link
                            }
                        ]
                    }]
                }).catch(() => { })
                : await interaction.reply({ content: `${e.Loading} | ${t("keyword_loading", locale)}`, fetchReply: true, embeds: [] });

            const toSubtract = Date.now();
            const replayPing = toSubtract - interaction.createdTimestamp;
            const calculate = () => Date.now() - toSubtract;

            const timeResponse = await Promise.all([
                client.rest.get(Routes.user(client.user!.id)).then(() => calculate()).catch(() => null),
                mongoose.connection?.db?.admin()?.ping().then(() => calculate()).catch(() => null),
                fetch("https://top.gg/api/bots/912509487984812043", { headers: { authorization: env.TOP_GG_TOKEN } }).then(res => res.ok ? calculate() : null).catch(() => null),
                
                discloud.user.fetch().then(() => calculate()).catch(() => null),
                fetch(urls.saphireSiteUrl).then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
                fetch(urls.saphireApiUrl + "/ping").then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
                socket.ws?.timeout(10000).emitWithAck("ping", "ping").then(() => calculate()).catch(() => null),
                socket.twitch.ws?.timeout(10000).emitWithAck("ping", "ping").then(() => calculate()).catch(() => null),
                fetch("https://twitch.discloud.app/ping").then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null)
            ]);

            const timeString = [
                `${e.discordLogo} | ${t("ping.discord_api", locale)}:`,
                `${e.Database} | ${t("ping.database_latency", locale)}:`,
                `${e.topgg} | ${t("ping.topgg_api_latency", locale)}:`,
                
                `${e.discloud} | ${t("ping.discloud_api_latency", locale)}:`,
                `🌐 | ${t("ping.site_latency", locale)}:`,
                `${e.api} | ${t("ping.api_latency", locale)}:`,
                `${e.websocket} | ${t("ping.websocket_latency", locale)}:`,
                `${e.twitch} | ${t("ping.twitch_websocket", locale)}:`,
                `${e.twitch} | ${t("ping.twitch_api", locale)}:`,
            ];

            // const timeString = [
            //     `${t("ping.discloud_api_latency", locale)}:`,
            //     `${t("ping.database_latency", locale)}:`,
            //     `${t("ping.topgg_api_latency", locale)}:`,
                
            //     `${t("ping.site_latency", locale)}:`,
            //     `${t("ping.api_latency", locale)}:`,
            //     `${t("ping.websocket_latency", locale)}:`,
            //     `${t("ping.twitch_websocket", locale)}:`,
            //     `${t("ping.twitch_api", locale)}:`,
            // ];

            const requests = [];
            for (let i = 0; i < timeResponse.length; i++)
                requests.push(`${timeString[i]} ${emojiFormat(timeResponse[i] as number | null)}`);

            return await interaction.editReply({
                content: `🧩 | **Shard ${client.shardId}/${((client.shard?.count || 1) - 1) || 0} [Cluster ${client.clusterName}]**\n⏱️ | ${Date.stringDate(client.uptime ? client.uptime : 0, false, locale || "pt-BR")}\n${e.slash} | ${client.interactions.currency() || 0} ${t("keyword_interactions_in_session", locale)}\n✍️ | ${t("ping.interaction_response", locale)}: ${emojiFormat(replayPing)}\n🔗 | ${t("ping.discord_websocket_latency", locale)}: ${emojiFormat(client.ws.ping)}\n${requests.join("\n")}`,
                embeds: [],
                // embeds: [{
                //     color: Colors.Blue,
                //     title: `🧩 **Shard ${client.shardId}/${((client.shard?.count || 1) - 1) || 0} [Cluster ${client.clusterName}]**`,
                //     description: `⏱️ ${Date.stringDate(client.uptime ? client.uptime : 0, false, locale || "pt-BR")}\n${e.slash} ${client.interactions.currency() || 0} ${t("keyword_interactions_in_session", locale)}`,
                //     fields: [
                //         {
                //             name: `${e.discordLogo} Discord`,
                //             value: `${t("ping.interaction_response", locale)}: ${emojiFormat(replayPing)}\n${t("ping.discord_websocket_latency", locale)}: ${emojiFormat(client.ws.ping)}`
                //         },
                //         {
                //             name: `${e.Animated.SaphireDance} Saphire Moon`,
                //             value: requests.slice(3, 100).join("\n")
                //         },
                //         {
                //             name: `${e.Animated.SaphireReading} Outros`,
                //             value: requests.slice(0, 3).join("\n")
                //         }
                //     ]
                // }],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("keyword_refresh", locale),
                                emoji: "🔄".emoji(),
                                custom_id: JSON.stringify({ c: "ping", userId: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: t("keyword_botinfo", locale),
                                emoji: "🔎".emoji(),
                                custom_id: JSON.stringify({ c: "botinfo", userId: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: "Shards",
                                emoji: "🧩".emoji(),
                                custom_id: JSON.stringify({ c: "ping", src: "shard", userId: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: t("keyword_status", locale),
                                emoji: "📊".emoji(),
                                url: urls.saphireSiteUrl + "/status",
                                style: ButtonStyle.Link
                            }
                        ]
                    }
                ]
            })
                .catch(() => { });

            function emojiFormat(ms: number | null) {
                if (!ms) return "💔 Offline";

                const intervals = [800, 600, 400, 200, 0];
                const emojis = ["🔴", "🟤", "🟠", "🟡", "🟢", "🟣"];

                let emoji = "🟣";
                for (let i = 0; i < intervals.length; i++)
                    if (ms >= intervals[i]) {
                        emoji = emojis[i];
                        break;
                    }

                return `${emoji} **${ms}**ms`;
            }

        }
    }
};