import { APIEmbed, APIGuildIntegration, ChatInputCommandInteraction, Colors, Guild, Message, StringSelectMenuInteraction, codeBlock } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import client from "../../../saphire";
export const serverinfoCache = new Map<string, Guild>();

export default async function serverinfo(
    messageOrInteraction: ChatInputCommandInteraction<"cached"> | Message<true> | StringSelectMenuInteraction<"cached">,
    args: string[],
    isRefresh?: boolean
) {

    const { userLocale: locale } = messageOrInteraction;

    const user = messageOrInteraction instanceof ChatInputCommandInteraction || messageOrInteraction instanceof StringSelectMenuInteraction
        ? messageOrInteraction.user : messageOrInteraction.author;

    const guildId = messageOrInteraction instanceof ChatInputCommandInteraction
        ? messageOrInteraction.options.getString("search") || messageOrInteraction.guildId
        : messageOrInteraction instanceof StringSelectMenuInteraction
            ? (JSON.parse(messageOrInteraction.customId))?.id || messageOrInteraction.guildId
            : args[0] || messageOrInteraction.guildId;

    const message = messageOrInteraction instanceof StringSelectMenuInteraction
        ? isRefresh
            ? await messageOrInteraction.message.edit({ content: null, embeds: messageOrInteraction.message.embeds, components: [] })
            : await messageOrInteraction.update({
                content: t("serverinfo.home.loading", { e, locale }),
                embeds: [],
                components: []
            })
        : await messageOrInteraction.reply({
            content: t("serverinfo.home.loading", { e, locale }),
            fetchReply: true
        });

    const guild = serverinfoCache.get(guildId)
        || guildId === messageOrInteraction.guildId
        ? messageOrInteraction.guild
        : await client.getGuild(guildId);

    if (!guild)
        return await message.edit({ content: t("serverinfo.not_found", { e, locale }) }).catch(() => { });

    if (!serverinfoCache.has(guildId))
        setTimeout(() => serverinfoCache.delete(guildId), 1000 * 5 * 60);

    serverinfoCache.set(guild.id, guild);

    const data = {
        bannerURL: guild.bannerURL({ size: 512 }) || guild.discoverySplashURL({ size: 512 }),
        memberCount: guild.memberCount,
        iconURL: guild.iconURL(),
        joinedAt: {
            first: guild.joinedAt.toLocaleString(locale),
            second: Date.stringDate((Date.now() - (guild.joinedAt?.valueOf() || 0)), false, locale)
        },
        guildOwner: await guild.fetchOwner()
            .then(member => member.user.username)
            .catch(async () => await guild.members.fetch(guild.ownerId || "0")
                .then(member => member.user.username)
                .catch(() => t("serverinfo.home.owner_not_found", locale)))
    };

    const fields = [
        {
            name: t("serverinfo.home.server_and_ownership", locale),
            value: `**${guild.name}**\n${t("serverinfo.home.owner", { locale, e, data, guild })}`
        },
        {
            name: t("serverinfo.home.fundation", locale),
            value: t("serverinfo.home.born_at", {
                locale,
                born_date: guild.createdAt.toLocaleString(locale),
                created: Date.stringDate(Date.now() - (guild.createdAt?.valueOf()), false, locale)
            })
        }
    ];

    const whoAddMe = await (async () => {
        const data = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/integrations`,
            { headers: { authorization: `Bot ${process.env.DISCORD_TOKEN}` } }
        )
            .then(res => res.json())
            .catch(() => []) as APIGuildIntegration[];

        if (data?.length) {
            const app = data.find(d => d.account?.id === client.user?.id);
            if (!app) return "";
            return `\n${t("serverinfo.home.who_add_me", { locale, app })}`;
        }
    })();

    if (data.joinedAt.first)
        fields.push({
            name: t("serverinfo.home.relationship", { e, locale }),
            value: t("serverinfo.home.relationship_arrived", { locale, data, whoAddMe })
        });

    if (guild.description)
        fields.push({
            name: t("serverinfo.home.description", locale),
            value: codeBlock("txt", guild.description || t("serverinfo.home.nothing_here", locale))
        });

    return await message?.edit({
        content: null,
        embeds: [{
            color: Colors.Blue,
            title: t("serverinfo.home.embed.title", locale),
            description: t("serverinfo.home.embed.description", { locale, user }),
            thumbnail: { url: data.iconURL },
            image: { url: data.bannerURL },
            fields,
            footer: {
                text: `🆔 ${guild?.id}`,
                icon_url: data.iconURL
            }
        }] as APIEmbed[],
        components: [{
            type: 1,
            components: [{
                type: 3,
                custom_id: JSON.stringify({ c: "serverinfo", id: guild?.id, uid: user?.id }),
                placeholder: t("serverinfo.components.placeholder", locale),
                options: [
                    {
                        label: t("serverinfo.components.options.0.label", locale),
                        emoji: "⬅️",
                        description: t("serverinfo.components.options.0.description", locale),
                        value: "firstPage"
                    },
                    {
                        label: t("serverinfo.components.options.1.label", locale),
                        emoji: "🔢",
                        description: t("serverinfo.components.options.1.description", locale),
                        value: "numbers"
                    },
                    {
                        label: t("serverinfo.components.options.2.label", locale),
                        emoji: "🖼️",
                        description: t("serverinfo.components.options.2.description", locale),
                        value: "images"
                    },
                    {
                        label: t("serverinfo.components.options.3.label", locale),
                        emoji: e.Info,
                        description: t("serverinfo.components.options.3.description", locale),
                        value: "suplement"
                    },
                    {
                        label: t("serverinfo.components.options.4.label", locale),
                        emoji: "💫",
                        description: t("serverinfo.components.options.4.description", locale),
                        value: "features"
                    },
                    {
                        label: t("serverinfo.components.options.5.label", locale),
                        emoji: e.amongusdance,
                        description: t("serverinfo.components.options.5.description", locale),
                        value: "emojis"
                    },
                    {
                        label: t("serverinfo.components.options.6.label", locale),
                        emoji: "🔰",
                        description: t("serverinfo.components.options.6.description", locale),
                        value: "roles"
                    },
                    {
                        label: t("serverinfo.components.options.7.label", locale),
                        emoji: "🔄",
                        description: t("serverinfo.components.options.7.description", locale),
                        value: "refresh"
                    }
                ]
            }]
        }].asMessageComponents()
    })
        .catch(() => message?.delete()?.catch(() => { }));

}