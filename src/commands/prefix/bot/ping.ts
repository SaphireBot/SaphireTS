import { ButtonStyle, ComponentType, Message, Routes } from "discord.js";
import { discloud } from "discloud.app";
import { urls } from "../../../util/constants";
import { env } from "process";
import { e } from "../../../util/json";
import socket from "../../../services/api/ws";
import client from "../../../saphire";
import { t } from "../../../translator";
import pingShard from "../../components/buttons/ping/shards.ping";
import Database from "../../../database";

const complete = [
    "vollständig",
    "komplett",
    "complete",
    "finished",
    "status",
    "full",
    "concluído",
    "complet",
    "terminé",
    "terminado",
    "estado",
    "estatus",
    "lleno",
    "completo",
    "plein",
    "完了",
    "完全",
    "ステータス",
    "満員",
    "total",
    "完整",
    "完成",
    "饱满",
    "alle",
    "all",
    "todo",
    "tout",
    "すべて",
    "todos",
    "一切",
    "全部",
    "s",
    "c",
    "f",
    "v"
];

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

        if (args && ["shard", "shards"].includes(args[0]))
            return await pingShard(null, message, { c: "ping", src: "shard", userId: message.author.id });

        const { userLocale: locale } = message;
        const replayPing = Date.now() - message.createdTimestamp;

        if (!complete.includes(args?.[0]?.toLowerCase() || ""))
            return await message.reply({
                content: `🧩 | **Shard ${client.shardId}/${((client.shard?.count || 1) - 1) || 0} [Cluster ${client.clusterName}]**\n⚡ | Pong ~${replayPing.currency()}ms`
            });

        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", locale)}` });

        const toSubtract = Date.now();
        const calculate = () => Date.now() - toSubtract;

        const timeResponse = await Promise.all([
            client.rest.get(Routes.user(client.user!.id)).then(calculate).catch(() => null),
            Database.ping.SaphireCluster().then(calculate).catch(() => null),
            // Database.ping.BetCluster().then(calculate).catch(() => null),
            // Database.ping.RecordCluster().then(calculate).catch(() => null),
            Database.Redis?.ping().then(calculate).catch(() => null),
            Database.Ranking?.ping().then(calculate).catch(() => null),
            Database.UserCache?.ping().then(calculate).catch(() => null),
            fetch("https://top.gg/api/bots/912509487984812043", { headers: { authorization: env.TOP_GG_TOKEN } }).then(res => res.ok ? calculate() : null).catch(() => null),

            discloud.user.fetch().then(calculate).catch(() => null),
            fetch(urls.saphireSiteUrl).then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
            fetch(urls.saphireApiUrl + "/ping").then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null),
            socket.emitWithAck("api", 10000, "ping", null, "ping").then(calculate),
            socket.emitWithAck("twitch", 10000, "ping", null, "ping").then(calculate),
            fetch(env.TWITCH_API_URL + "/ping").then(res => res.ok ? calculate() : null).catch(() => null).catch(() => null)
        ]);

        const timeString = [
            `${e.discordLogo} | ${t("ping.discord_api", locale)}:`,
            `${e.mongodb} | [Cluster 1] ${t("ping.database_latency", locale)}:`,
            // `${e.mongodb} | [Cluster 2] ${t("ping.database_latency", locale)}:`,
            // `${e.mongodb} | [Cluster 3] ${t("ping.database_latency", locale)}:`,
            `${e.redis} | ${t("ping.redis_database", locale)}:`,
            `${e.redis} | ${t("ping.redis_ranking", locale)}:`,
            `${e.redis} | ${t("ping.redis_users", locale)}:`,
            `${e.topgg} | ${t("ping.topgg_api_latency", locale)}:`,

            `${e.discloud} | ${t("ping.discloud_api_latency", locale)}:`,
            `🌐 | ${t("ping.site_latency", locale)}:`,
            `${e.api} | ${t("ping.api_latency", locale)}:`,
            `${e.websocket} | ${t("ping.websocket_latency", locale)}:`,
            `${e.twitch} | ${t("ping.twitch_websocket", locale)}:`,
            `${e.twitch} | ${t("ping.twitch_api", locale)}:`,
        ];

        const requests = [];
        for (let i = 0; i < timeResponse.length; i++)
            requests.push(`${timeString[i]} ${emojiFormat(timeResponse[i] as number | null)}`);

        return await msg.edit({
            content: `🧩 | **Shard ${client.shardId}/${((client.shard?.count || 1) - 1) || 0} [Cluster ${client.clusterName}]**\n⏱️ | ${Date.stringDate(client.uptime ? client.uptime : 0, false, locale || locale)}\n✍️ | ${t("ping.interaction_response", locale)}: ${emojiFormat(replayPing)}\n🔗 | ${t("ping.discord_websocket_latency", locale)}: ${emojiFormat(client.ws.ping)}\n${requests.join("\n")}`,
            embeds: [],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: ComponentType.Button,
                            label: t("keyword_refresh", locale),
                            emoji: "🔄".emoji(),
                            custom_id: JSON.stringify({ c: "ping", userId: message.author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: ComponentType.Button,
                            label: t("keyword_botinfo", locale),
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
                            label: t("keyword_status", locale),
                            emoji: "📊".emoji(),
                            url: urls.saphireSiteUrl + "/status",
                            style: ButtonStyle.Link
                        }
                    ]
                }
            ]
        }).catch(() => { });

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