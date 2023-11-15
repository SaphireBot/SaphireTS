import { ButtonStyle, ComponentType, Message, Routes } from "discord.js";
import { discloud } from "discloud.app";
import { urls } from "../../../util/constants";
import { env } from "process";
import { e } from "../../../util/json";
import socket from "../../../services/api/ws";
import mongoose from "mongoose";
import client from "../../../saphire";
import { t } from "../../../translator";
import pingShard from "../../components/buttons/ping/shards.ping";

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

        const { userLocale: locale } = message;
        if (args && ["shard", "shards"].includes(args[0])) return pingShard(null, message, { c: "ping", src: "shard", userId: message.author.id });

        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", locale)}` });

        const toSubtract = Date.now();
        const replayPing = toSubtract - message.createdTimestamp;
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

        const requests = [];
        for (let i = 0; i < timeResponse.length; i++)
            requests.push(`${timeString[i]} ${emojiFormat(timeResponse[i] as number | null)}`);

        return await msg.edit({
            content: `🧩 | **Shard ${client.shardId}/${((client.shard?.count || 1) - 1) || 0} [Cluster ${client.clusterName}]**\n⏱️ | ${Date.stringDate(client.uptime ? client.uptime : 0, false, locale || "pt-BR")}\n${e.slash} | ${client.interactions.currency() || 0} ${t("keyword_interactions_in_session", locale)}\n✍️ | ${t("ping.interaction_response", locale)}: ${emojiFormat(replayPing)}\n🔗 | ${t("ping.discord_websocket_latency", locale)}: ${emojiFormat(client.ws.ping)}\n${requests.join("\n")}`,
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