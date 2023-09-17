import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, codeBlock, ChatInputCommandInteraction, ButtonInteraction, ComponentType } from "discord.js";
import mongoose from "mongoose";
import { discloud } from "discloud.app";
import { e } from "../../../util/json";
import socket from "../../../services/api/ws/index";
import { env } from "process";
import client from "../../../saphire/index";
import { urls } from "../../../util/constants";
import { t } from "../../../translator";

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
        description: "[bot] Comando de ping",
        description_localizations: {},
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "options",
                description: "Opções do comando ping",
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "Ping das Shards",
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
            if (commandData?.src === "shard") return pingShard();

            if (!toRefresh && interaction.isChatInputCommand())
                if (interaction.options.getString("options") === "shard") return pingShard();

            toRefresh && interaction.isButton()
                ? await interaction.update({
                    fetchReply: true,
                    components: [{
                        type: 1,
                        components: [
                            {
                                type: ComponentType.Button,
                                label: t("System_loading", interaction.userLocale),
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
                : await interaction.reply({ content: `${e.Loading} | ${t("System_loading", interaction.userLocale)}`, fetchReply: true, embeds: [] });

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
                `${e.discloud} | Discloud API Latency:`,
                "🌐 | Saphire Site Latency:",
                `${e.api} | Saphire API Latency:`,
                `${e.websocket} | Saphire Websocket API Latency:`,
                `${e.Database} | Database Response Latency:`,
                `${e.topgg} | Top.gg API Latency:`
            ];

            const requests = timeResponse.map((value, i) => `${timeString[i]} ${emojiFormat(value)}`).join("\n");

            return await interaction.editReply({
                content: `🧩 | **Shard ${client.shardId}/${((client.shard?.count || 1) - 1) || 0} [Cluster ${client.clusterName}]**\n⏱️ | ${Date.stringDate(client.uptime ? client.uptime : 0)}\n${e.slash} | ${client.interactions.currency() || 0} interações com ${client.messages.currency() || 0} mensagens\n⚡ | Interaction Response: ${emojiFormat(replayPing)}\n${e.discordLogo} | Discord Websocket Latency: ${emojiFormat(client.ws.ping)}\n${requests}`,
                embeds: [],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("System_refresh", interaction.userLocale),
                                emoji: "🔄".emoji(),
                                custom_id: JSON.stringify({ c: "ping", userId: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: "Bot Info",
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
                                label: "Status",
                                emoji: "📊".emoji(),
                                url: urls.saphireSiteUrl + "/status",
                                style: ButtonStyle.Link
                            }
                        ]
                    }
                ]
            });

            async function pingShard() {

                const shards = [];
                const content = t("System_getting_shard_data", interaction.userLocale);
                commandData?.src && interaction.isButton()
                    ? await interaction.update({ content, embeds: [], components: [] }).catch(() => { })
                    : await interaction.reply({ content, embeds: [], components: [] });

                const components = [
                    {
                        type: 1,
                        components: [

                            {
                                type: 2,
                                label: t("System_refresh", interaction.userLocale),
                                emoji: "🔄",
                                custom_id: JSON.stringify({ c: "ping", src: "shard", userId: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: "Bot Info",
                                emoji: "🔎",
                                custom_id: JSON.stringify({ c: "botinfo", userId: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: "Ping",
                                emoji: "🏓",
                                custom_id: JSON.stringify({ c: "ping", userId: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: "Status",
                                emoji: "📊",
                                url: urls.saphireSiteUrl + "/status",
                                style: ButtonStyle.Link
                            }
                        ]
                    }
                ].asComponents();

                const shardsData = await socket
                    .timeout(4000)
                    .emitWithAck("getShardsData", "get")
                    .catch(() => null);

                if (!shardsData)
                    return interaction.editReply({
                        content: `${e.DenyX} | ${t("System_no_data_recieved", interaction.userLocale)}`,
                        components
                    }).catch(() => { });

                shardsData.length = client.shard?.count || 1;
                for (let i = 0; i < shardsData.length; i++) {
                    const shard = shardsData[i];

                    const data = {
                        id: (shard?.id ?? i),
                        status: shard?.ready ? "Online" : "Offline",
                        ping: (shard?.ms ?? "0") + "ms",
                        guilds: shard?.guildsCount ?? 0,
                        users: shard?.usersCount ?? 0,
                        clusterName: shard?.clusterName ?? "Offline"
                    };

                    shards.push(`${data?.id ?? "?"} | ${data.status} | ${data?.ping || 0} | Guilds: ${data?.guilds || 0} | Users: ${data?.users || 0} | Cluster: ${data?.clusterName || "Offline"}`);
                }

                const data = {
                    content: `Shard ID: ${client.shardId}\n${codeBlock("txt", shards.join("\n") + `\n${shardsData.length !== (client.shard?.count || 1) ? t("System_shards_still_starting", interaction.userLocale) : ""}`)}`,
                    components
                };

                return interaction.editReply(data).catch(() => { });
            }

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