import { AttachmentBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Message, parseEmoji } from "discord.js";
import { t } from "../../../../translator";
import { urls } from "../../../../util/constants";
import socket from "../../../../services/api/ws";
import { e } from "../../../../util/json";
import client from "../../../../saphire";
import { mapButtons } from "djs-protofy";

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
    const content = `${e.Loading} | ${t("System_getting_shard_data", { locale, e })}`;
    const msg = commandData?.src && interaction?.isButton()
        ? await (async () => {
            const customId = JSON.stringify({ c: "ping", src: "shard", userId });
            const components = mapButtons(interaction.message.components, button => {
                if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;
                if (button.custom_id === customId) button.emoji = parseEmoji(e.Loading)!;
                button.disabled = true;
                return button;
            });
            return await interaction.update({
                components,
                withResponse: true,
            })
                .then(res => res.resource?.message)
                .catch(() => { });
        })()
        : interaction
            ? await interaction.reply({
                content, embeds: [],
                components: [], withResponse: true,
            }).then(res => res.resource?.message)
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
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    label: t("keyword_botinfo", locale),
                    emoji: "🔎".emoji(),
                    custom_id: JSON.stringify({ c: "botinfo", userId }),
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    label: "Ping",
                    emoji: "🏓".emoji(),
                    custom_id: JSON.stringify({ c: "ping", userId }),
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    label: t("keyword_status", locale),
                    emoji: "📊",
                    url: urls.saphireSiteUrl + "/status",
                    style: ButtonStyle.Link,
                },
            ],
        },
    ].asMessageComponents();

    const shardsData: any[] = await socket.emitWithAck("api", 4000, "getShardsData", null, "get");

    if (!shardsData)
        return msg?.edit({
            content: t("System_no_data_recieved", { locale, e }),
            components,
            files: [],
            embeds: [],
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
            clusterName: shard?.clusterName ?? "Offline",
        };

        shards.push(`${data?.id ?? "?"} | ${data.status} | ${data?.ping || 0} | Guilds: ${data?.guilds || 0} | Users: ${data?.users || 0} | Cluster: ${data?.clusterName || "Offline"}`);
    }

    let text = `${client.user?.username} Sharding System - PING DOCUMENT\nTotal Shards: ${shardsData.length}`;
    text += `\nShard Origin: ${client.shardId}`;
    text += `\nCreated At: ${new Date().toLocaleDateString(locale) + " " + new Date().toLocaleTimeString(locale)}`;
    text += `\n \n${shards.join("\n") + `${shardsData.length !== (client.shard?.count || 1) ? t("System_shards_still_starting", locale) : ""}`}`;

    const attachment = new AttachmentBuilder(
        Buffer.from(text),
        {
            name: "saphire-shards-pinging.txt",
            description: "Saphire Shards Pinging Document",
        },
    );

    return msg?.edit({
        content: null,
        files: [attachment],
        components,
        embeds: [],
    }).catch(() => { });
}