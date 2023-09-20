import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, ButtonInteraction, ComponentType } from "discord.js";
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
        dm_permission: false,
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

            const toRefresh = commandData?.c;
            if (commandData?.src === "shard") return pingShard(interaction, null, commandData);

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
                                label: t("keyword_loading", interaction.userLocale),
                                emoji: e.Loading.emoji(),
                                custom_id: "refreshing",
                                style: ButtonStyle.Primary,
                                disabled: true
                            },
                            {
                                type: ComponentType.Button,
                                label: t("System_status", interaction.userLocale),
                                emoji: "📊".emoji(),
                                url: urls.saphireSiteUrl + "/status",
                                style: ButtonStyle.Link
                            }
                        ]
                    }]
                }).catch(() => { })
                : await interaction.reply({ content: `${e.Loading} | ${t("keyword_loading", interaction.userLocale)}`, fetchReply: true, embeds: [] });

            const toSubtract = Date.now();
            const replayPing = toSubtract - interaction.createdTimestamp;
            const calculate = () => Date.now() - toSubtract;

            const timeResponse = await Promise.all([
                discloud.user.fetch().then(() => calculate()).catch(() => null),
                fetch(urls.saphireSiteUrl).then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
                fetch(urls.saphireApiUrl + "/ping").then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
                fetch("https://top.gg/api/bots/912509487984812043", { headers: { authorization: env.TOP_GG_TOKEN } }).then(res => res.ok ? calculate() : null).catch(() => null),
                socket.ws?.timeout(10000).emitWithAck("ping", "ping").then(() => calculate()).catch(() => null),
                mongoose.connection?.db?.admin()?.ping().then(() => calculate()).catch(() => null)
            ]);

            const timeString = [
                `${e.discloud} | ${t("ping.discloud_api_latency", interaction.userLocale)}:`,
                `🌐 | ${t("ping.site_latency", interaction.userLocale)}:`,
                `${e.api} | ${t("ping.api_latency", interaction.userLocale)}:`,
                `${e.websocket} | ${t("ping.websocket_latency", interaction.userLocale)}:`,
                `${e.Database} | ${t("ping.database_latency", interaction.userLocale)}:`,
                `${e.topgg} | ${t("ping.topgg_api_latency", interaction.userLocale)}:`
            ];

            const requests = timeResponse.map((value, i) => `${timeString[i]} ${emojiFormat(value)}`).join("\n");

            return await interaction.editReply({
                content: `🧩 | **Shard ${client.shardId}/${((client.shard?.count || 1) - 1) || 0} [Cluster ${client.clusterName}]**\n⏱️ | ${Date.stringDate(client.uptime ? client.uptime : 0, false, interaction.userLocale || "pt-BR")}\n${e.slash} | ${client.interactions.currency() || 0} ${t("keyword_interactions", interaction.userLocale)} & ${client.messages.currency() || 0} ${t("keyword_messages", interaction.userLocale)}\n⚡ | ${t("ping.interaction_response", interaction.userLocale)}: ${emojiFormat(replayPing)}\n${e.discordLogo} | ${t("ping.discord_websocket_latency", interaction.userLocale)}: ${emojiFormat(client.ws.ping)}\n${requests}`,
                embeds: [],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("keyword_refresh", interaction.userLocale),
                                emoji: "🔄".emoji(),
                                custom_id: JSON.stringify({ c: "ping", userId: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: t("keyword_botinfo", interaction.userLocale),
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
                                label: t("keyword_status", interaction.userLocale),
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