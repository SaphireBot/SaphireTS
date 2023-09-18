import { APIActionRowComponent, APIButtonComponent, ButtonStyle, ComponentType, Message, codeBlock } from "discord.js";
import { discloud } from "discloud.app";
import { urls } from "../../../util/constants";
import { env } from "process";
import { e } from "../../../util/json";
import socket from "../../../services/api/ws";
import mongoose from "mongoose";
import client from "../../../saphire";
import { t } from "../../../translator";

export default {
    name: "ping",
    description: "🏓 Ping pong",
    aliases: [],
    category: "bot",
    api_data: {
        category: "Saphire",
        synonyms: [],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, args: string[] | undefined) {

        if (args && ["shard", "shards"].includes(args[0])) return pingShard();

        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", message.userLocale)}` });

        const toSubtract = Date.now();
        const replayPing = toSubtract - message.createdTimestamp;
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
            `${e.discloud} | ${t("ping.discloud_api_latency", message.userLocale)}:`,
            `🌐 | ${t("ping.site_latency", message.userLocale)}:`,
            `${e.api} | ${t("ping.api_latency", message.userLocale)}:`,
            `${e.websocket} | ${t("ping.websocket_latency", message.userLocale)}:`,
            `${e.Database} | ${t("ping.database_latency", message.userLocale)}:`,
            `${e.topgg} | ${t("ping.topgg_api_latency", message.userLocale)}:`
        ];

        const requests = timeResponse.map((value, i) => `${timeString[i]} ${emojiFormat(value)}`).join("\n");

        return msg.edit({
            content: `🧩 | **Shard ${client.shardId}/${((client.shard?.count || 0) - 1) || 0} [Cluster ${client.clusterName}]**\n⏱️ | ${Date.stringDate(client.uptime ? client.uptime : 0, false, message.userLocale || "pt-BR")}\n${e.slash} | ${client.interactions.currency() || 0} ${t("keyword_interactions", message.userLocale)} & ${client.messages.currency() || 0} ${t("keyword_messages", message.userLocale)}\n⚡ | ${t("ping.interaction_response", message.userLocale)}: ${emojiFormat(replayPing)}\n${e.discordLogo} | ${t("ping.discord_websocket_latency", message.userLocale)}: ${emojiFormat(client.ws.ping)}\n${requests}`,
            embeds: [],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: ComponentType.Button,
                            label: t("keyword_refresh", message.userLocale),
                            emoji: "🔄".emoji(),
                            custom_id: JSON.stringify({ c: "ping", userId: message.author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: ComponentType.Button,
                            label: t("keyword_botinfo", message.userLocale),
                            emoji: "🔎".emoji(),
                            custom_id: JSON.stringify({ c: "botinfo", userId: message.author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: ComponentType.Button,
                            label: "Shards",
                            emoji: "🧩".emoji(),
                            custom_id: JSON.stringify({ c: "ping", src: "shard", userId: message.author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: ComponentType.Button,
                            label: t("keyword_status", message.userLocale),
                            emoji: "📊".emoji(),
                            url: urls.saphireSiteUrl + "/status",
                            style: ButtonStyle.Link
                        }
                    ]
                }
            ]
        }).catch(() => { });

        async function pingShard() {

            const shards = [];
            const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", message.userLocale)}` });

            const components = [
                {
                    type: 1,
                    components: [

                        {
                            type: 2,
                            label: t("keyword_refresh", message.userLocale),
                            emoji: "🔄",
                            custom_id: JSON.stringify({ c: "ping", src: "shard", userId: message.author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("keyword_botinfo", message.userLocale),
                            emoji: "🔎",
                            custom_id: JSON.stringify({ c: "botinfo", userId: message.author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: "Ping",
                            emoji: "🏓",
                            custom_id: JSON.stringify({ c: "ping", userId: message.author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("keyword_status", message.userLocale),
                            emoji: "📊",
                            url: urls.saphireSiteUrl + "/status",
                            style: ButtonStyle.Link
                        }
                    ]
                }
            ] as APIActionRowComponent<APIButtonComponent>[];

            const shardsData = await socket
                .timeout(1000)
                .emitWithAck("getShardsData", "get")
                .catch(() => null);

            if (!shardsData)
                return msg.edit({
                    content: `${e.DenyX} | ${t("System_no_data_recieved", message.userLocale)}`,
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
                content: `Shard ID: ${client.shardId}\n${codeBlock("txt", shards.join("\n") + `\n${shardsData.length !== (client.shard?.count || 1) ? t("System_shards_still_starting", message.userLocale) : ""}`)}`,
                components
            };

            return msg.edit(data).catch(() => { });
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
};