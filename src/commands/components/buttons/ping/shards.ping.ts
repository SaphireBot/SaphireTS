import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Message, codeBlock } from "discord.js";
import { t } from "../../../../translator";
import { urls } from "../../../../util/constants";
import socket from "../../../../services/api/ws";
import { e } from "../../../../util/json";
import client from "../../../../saphire";

export default async function pingShard(
    interaction: ChatInputCommandInteraction | ButtonInteraction | null,
    message: Message | null,
    commandData: {
        c: "ping" | "botinfo" | "ping",
        src: "shard",
        userId: string
    }) {

    if (!interaction && !message) return;

    const shards = [];
    const locale = interaction?.userLocale || message?.userLocale;
    const userId = interaction?.user.id || message?.author.id;
    const content = t("System_getting_shard_data", { locale, e });
    const msg = commandData?.src && interaction?.isButton()
        ? await interaction.update({ content, embeds: [], components: [], fetchReply: true }).catch(() => { })
        : interaction
            ? await interaction.reply({ content, embeds: [], components: [], fetchReply: true })
            : await message?.reply({ content });

    const components = [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("keyword_refresh", locale),
                    emoji: "🔄".emoji(),
                    custom_id: JSON.stringify({ c: "ping", src: "shard", userId }),
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: t("keyword_botinfo", locale),
                    emoji: "🔎".emoji(),
                    custom_id: JSON.stringify({ c: "botinfo", userId }),
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: "Ping",
                    emoji: "🏓".emoji(),
                    custom_id: JSON.stringify({ c: "ping", userId }),
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: t("keyword_status", locale),
                    emoji: "📊",
                    url: urls.saphireSiteUrl + "/status",
                    style: ButtonStyle.Link
                }
            ]
        }
    ].asMessageComponents();

    const shardsData = await socket
        .timeout(4000)
        .emitWithAck("getShardsData", "get")
        .catch(() => null);

    if (!shardsData)

        return msg?.edit({
            content: t("System_no_data_recieved", { locale, e }),
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
        content: `Shard ID: ${client.shardId}\n${codeBlock("txt", shards.join("\n") + `\n${shardsData.length !== (client.shard?.count || 1) ? t("System_shards_still_starting", locale) : ""}`)}`,
        components
    };

    return msg?.edit(data).catch(() => { });
}