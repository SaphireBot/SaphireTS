import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, ButtonInteraction, Routes, parseEmoji } from "discord.js";
import { discloud } from "discloud.app";
import { e } from "../../../util/json";
import socket from "../../../services/api/ws/index";
import { env } from "process";
import client from "../../../saphire/index";
import { urls } from "../../../util/constants";
import { t } from "../../../translator";
import pingShard from "../../components/buttons/ping/shards.ping";
import { getLocalizations } from "../../../util/getlocalizations";
import Database from "../../../database";
import { mapButtons } from "djs-protofy";

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
        integration_types: [0, 1],
        contexts: [0, 1, 2],
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
                        value: "shard",
                    },
                ],
            },
        ],
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
                bot: [],
            },
        },
        async execute(
            interaction: ChatInputCommandInteraction | ButtonInteraction,
            commandData?: {
                c: "ping" | "botinfo" | "ping",
                src: "shard",
                userId: string
            },
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
                        username: interaction.message.interaction?.user?.username || t("ping.no_username_found", locale),
                    }),
                    ephemeral: true,
                });

            const toRefresh = commandData?.c;
            if (commandData?.src === "shard") return await pingShard(interaction, null, commandData);

            if (!toRefresh && interaction.isChatInputCommand())
                if (interaction.options.getString("options") === "shard") return await pingShard(interaction, null, { c: "ping", src: "shard", userId: interaction.user.id });

            if (toRefresh && interaction.isButton()) {
                const customId = JSON.stringify({ c: "ping", userId: interaction.user.id });
                const components = mapButtons(interaction.message.components, button => {
                    if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;
                    if (button.custom_id === customId) button.emoji = parseEmoji(e.Loading)!;
                    button.disabled = true;
                    return button;
                });

                await interaction.update({ fetchReply: true, components }).catch(() => { });
            } else await interaction.reply({ content: `${e.Loading} | ${t("keyword_loading", locale)}`, fetchReply: true, embeds: [] });

            const toSubtract = Date.now();
            const replayPing = toSubtract - interaction.createdTimestamp;
            function calculate() {
                return Date.now() - toSubtract;
            }

            const timeResponse = await Promise.all([
                client.rest.get(Routes.user(client.user!.id)).then(calculate).catch(() => null),
                Database.ping.SaphireCluster().then(calculate).catch(() => null),
                Database.ping.BetCluster().then(calculate).catch(() => null),
                Database.ping.RecordCluster().then(calculate).catch(() => null),
                Database.Redis?.ping().then(calculate).catch(() => null),
                Database.Ranking?.ping().then(calculate).catch(() => null),
                Database.UserCache?.ping().then(calculate).catch(() => null),
                fetch("https://top.gg/api/bots/912509487984812043", { headers: { authorization: env.TOP_GG_TOKEN } }).then(res => res.ok ? calculate() : null).catch(() => null),

                discloud.user.fetch().then(calculate).catch(() => null),
                fetch(urls.saphireSiteUrl).then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
                fetch(urls.saphireApiUrl + "/ping").then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
                fetch(urls.saphireApiV2 + "/ping").then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
                socket.emitWithAck("api", 10000, "ping", null, "ping").then(calculate),
                socket.emitWithAck("twitch", 10000, "ping", null, "ping").then(calculate),
                fetch(urls.saphireTwitch + "/ping").then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
            ]);

            const timeString = [
                `${e.discordLogo} | ${t("ping.discord_api", locale)}:`,
                `${e.mongodb} | [Cluster 1] ${t("ping.database_latency", locale)}:`,
                `${e.mongodb} | [Cluster 2] ${t("ping.database_latency", locale)}:`,
                `${e.mongodb} | [Cluster 3] ${t("ping.database_latency", locale)}:`,
                `${e.redis} | ${t("ping.redis_database", locale)}:`,
                `${e.redis} | ${t("ping.redis_ranking", locale)}:`,
                `${e.redis} | ${t("ping.redis_users", locale)}:`,
                `${e.topgg} | ${t("ping.topgg_api_latency", locale)}:`,

                `${e.discloud} | ${t("ping.discloud_api_latency", locale)}:`,
                `🌐 | ${t("ping.site_latency", locale)}:`,
                `${e.api} | ${t("ping.api_latency", locale)}:`,
                `${e.api} | ${t("ping.api_latency", locale)} V2:`,
                `${e.websocket} | ${t("ping.websocket_latency", locale)}:`,
                `${e.twitch} | ${t("ping.twitch_websocket", locale)}:`,
                `${e.twitch} | ${t("ping.twitch_api", locale)}:`,
            ];

            const requests = [];
            for (let i = 0; i < timeResponse.length; i++)
                requests.push(`${timeString[i]} ${emojiFormat(timeResponse[i] as number | null)}`);

            return await interaction.editReply({
                content: `🧩 | **Shard ${client.shardId}/${((client.shard?.count || 1) - 1) || 0} [Cluster ${client.clusterName}]**\n⏱️ | ${Date.stringDate(client.uptime ? client.uptime : 0, false, locale || locale)}\n✍️ | ${t("ping.interaction_response", locale)}: ${emojiFormat(replayPing)}\n🔗 | ${t("ping.discord_websocket_latency", locale)}: ${emojiFormat(client.ws.ping)}\n${requests.join("\n")}`,
                embeds: [],
                files: [],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("keyword_refresh", locale),
                                emoji: "🔄".emoji(),
                                custom_id: JSON.stringify({ c: "ping", userId: interaction.user.id }),
                                style: ButtonStyle.Primary,
                            },
                            {
                                type: 2,
                                label: t("keyword_botinfo", locale),
                                emoji: "🔎".emoji(),
                                custom_id: JSON.stringify({ c: "botinfo", userId: interaction.user.id }),
                                style: ButtonStyle.Primary,
                            },
                            {
                                type: 2,
                                label: "Shards",
                                emoji: "🧩".emoji(),
                                custom_id: JSON.stringify({ c: "ping", src: "shard", userId: interaction.user.id }),
                                style: ButtonStyle.Primary,
                            },
                            {
                                type: 2,
                                label: t("keyword_status", locale),
                                emoji: "📊".emoji(),
                                url: urls.saphireSiteUrl + "/status",
                                style: ButtonStyle.Link,
                            },
                        ],
                    },
                ],
            })
                .catch(() => { });

            function emojiFormat(ms: number | null) {
                if (!ms) return "💔 Offline";

                const intervals = [800, 600, 400, 200, 0];
                const emojis = [e.red, e.brown, e.orange, e.yellow, e.green, e.purple];

                let emoji = e.purple;
                for (let i = 0; i < intervals.length; i++)
                    if (ms >= intervals[i]) {
                        emoji = emojis[i];
                        break;
                    }

                return `${emoji} **${ms}**ms`;
            }

        },
    },
};