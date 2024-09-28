import { Events, parseEmoji, ButtonStyle, Routes, Colors } from "discord.js";
import client from "../saphire";
import Database from "../database";
// import { BlacklistData } from "../@types/commands";
import socket from "../services/api/ws";
import { e } from "../util/json";
import { Config } from "../util/constants";
import { defineGuildStatus } from "./functions/refreshShardStatus";

client.on(Events.GuildCreate, async function (guild): Promise<any> {
    if (!guild?.id || !guild?.name || !guild.available) return;
    defineGuildStatus(guild);

    // if (client.data?.Blacklist?.Guilds?.some((d: BlacklistData) => d.id === guild.id))
    //     return await guild.leave().catch(() => { });

    socket.send({
        type: "guildCreate",
        guildData: {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            owner: false,
            permissions: guild.members.me?.permissions,
            features: guild.features
        }
    });

    await Database.Guilds.updateOne(
        { id: guild.id },
        { $set: { id: guild.id, } },
        { upsert: true }
    );

    const invite = await guild.invites.create(
        guild.channels.cache.random()?.id || "",
        {
            temporary: false,
            reason: "An safe access to this guild logs"
        }
    ).catch(() => null);

    const components = [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: "Informações",
                    custom_id: JSON.stringify({ c: "serverinfo", id: guild.id }),
                    style: ButtonStyle.Primary,
                    emoji: parseEmoji(e.Info)
                }
            ]
        }
    ];

    if (invite)
        components[0].components.push({
            type: 2,
            label: "Convite",
            url: invite.url,
            emoji: parseEmoji("🔗"),
            style: ButtonStyle.Link
        } as any);

    components[0].components.push({
        type: 2,
        label: "Remover",
        emoji: parseEmoji("🛡️"),
        custom_id: JSON.stringify({ c: "removeGuild", id: guild.id }),
        style: ButtonStyle.Danger
    } as any);

    const whoAddMe = await guild.fetchIntegrations()
        .then(res => {
            const data = res.find(d => d.account?.id === client.user?.id);
            if (!data?.user?.username) return "";
            return `**${data?.user.username}** me adicionou`;
        })
        .catch(() => "");

    return await client.rest.post(
        Routes.channelMessages(Config.LogChannelId),
        {
            body: {
                content: null,
                embeds: [{
                    color: Colors.Green,
                    title: `${e.Animated.SaphireDance} Um novo servidor me adicionou`,
                    description: `📝 ${guild.name}\n🆔 \`${guild.id}\`\n👥 ${guild.memberCount} Membros${whoAddMe ? `\n💖 ${whoAddMe}` : ""}`,
                    thumbnail: { url: guild.iconURL() }
                }],
                components
            },
        }
    )
        .catch(async err => {
            return await client.users.send(Config.Andre,
                {
                    content: `${e.Animated.SaphirePanic} Deu ruim chefia \`#Events.GuildCreate\`\n${e.bug} | \`${err}\``
                }
            )
                .catch(() => { });
        });
});