import { ButtonStyle, ChannelType, codeBlock, PermissionsBitField, StringSelectMenuInteraction, Colors, Guild, NonThreadGuildBasedChannel, Collection, Invite, GuildEmoji, Role } from "discord.js";
import { e } from "../../../util/json.js";
import { t } from "../../../translator/index.js";

export default async function numbers(interaction: StringSelectMenuInteraction<"cached">, guild: Guild) {

    const { userLocale: locale } = interaction;
    const indexComponent = interaction.message.components.length > 1 ? 1 : 0;
    const components = interaction.message.components[indexComponent].toJSON();

    await interaction.update({
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: t("serverinfo.numbers.loading", locale),
                emoji: e.Loading,
                custom_id: "loading",
                style: ButtonStyle.Secondary,
                disabled: true,
            }].asMessageComponents(),
        }],
    }).catch(() => { });

    const channels = await guild.channels.fetch().catch(() => []) as Collection<string, NonThreadGuildBasedChannel | null>;
    const emojis = await guild.emojis.fetch().catch(() => null) as Collection<string, GuildEmoji> | null;
    const bots = await guild.fetchIntegrations().then(int => int.size).catch(() => 0);
    const bans = await guild.bans.fetch()?.then(bans => bans.size).catch(() => 0);
    const invites = await guild.invites.fetch().catch(() => null) as Collection<string, Invite> | null;
    const roles = await guild.roles.fetch().catch(() => null) as Collection<string, Role>;

    const data = {
        texts: channels?.filter(ch => [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(ch?.type as any)).size || 0,
        categories: channels?.filter(ch => ch?.type === ChannelType.GuildCategory).size || 0,
        voices: channels?.filter(ch => ch?.type === ChannelType.GuildVoice).size || 0,
        stages: channels?.filter(ch => ch?.type === ChannelType.GuildStageVoice).size || 0,
        forums: channels?.filter(ch => ch?.type === ChannelType.GuildForum).size || 0,
        emojis: {
            animated: emojis?.filter(emoji => emoji.animated).size || 0,
            normal: emojis?.filter(emoji => !emoji.animated).size || 0,
            available: emojis?.filter(emoji => emoji.available).size || 0,
            unavailable: emojis?.filter(emoji => !emoji.available).size || 0,
            total: emojis?.size || 0,
        },
        stickers: guild.stickers.cache.size || 0,
        stickers_and_emojis: (guild.stickers.cache.size || 0) + (emojis?.size || 0),
        members: {
            online: guild?.presences?.cache?.size || 0,
            max: guild.maximumMembers || 0,
            banned: bans,
            bots: bots,
            total: guild?.memberCount || 0,
        },
        roles: {
            administrators: roles.filter(role => role.permissions.has(PermissionsBitField.Flags.Administrator)).size || 0,
            total: roles.size,
        },
        boost: {
            premiumSubscriptionCount: guild.premiumSubscriptionCount || 0,
            premiumTier: {
                0: "0",
                1: "1",
                2: "2",
                3: "3 (Max)",
            }[guild.premiumTier] || "0",
        },
        invites: {
            amount: invites?.size || 0,
            uses: invites?.reduce((acc, invite) => acc += (invite as any).uses, 0) || 0,
            permanents: invites?.filter(invite => (invite as any).temporary).size || 0,
            temporary: invites?.filter(invite => !(invite as any).temporary).size || 0,
        },
        others: {
            maxStageChannelUsers: `${guild.maxStageVideoChannelUsers || 0} per/chat`,
            maximumMembers: guild.maximumMembers || 0,
            maxVideoChannelUsers: `${guild.maxStageVideoChannelUsers || 0} per/chat`,
            nsfwLevel: guild.nsfwLevel,
            afkTimeout: `${guild.afkTimeout} seconds`,
        },
    };

    return await interaction.editReply({
        embeds: [{
            color: Colors.Blue,
            title: t("serverinfo.numbers.embed.title", locale),
            description: t("serverinfo.numbers.embed.description", { locale, e }),
            fields: [
                {
                    name: t("serverinfo.numbers.embed.fields.0.name", locale),
                    value: codeBlock("txt", t("serverinfo.numbers.embed.fields.0.value", { locale, data })),
                    inline: true,
                },
                {
                    name: t("serverinfo.numbers.embed.fields.1.name", locale),
                    value: codeBlock("txt", t("serverinfo.numbers.embed.fields.1.value", { locale, data })),
                    inline: true,
                },
                {
                    name: t("serverinfo.numbers.embed.fields.2.name", locale),
                    value: codeBlock("txt", t("serverinfo.numbers.embed.fields.2.value", { locale, data })),
                    inline: false,
                },
                {
                    name: t("serverinfo.numbers.embed.fields.3.name", locale),
                    value: codeBlock("txt", t("serverinfo.numbers.embed.fields.3.value", { locale, data })),
                    inline: true,
                },
                {
                    name: t("serverinfo.numbers.embed.fields.4.name", { locale, e }),
                    value: codeBlock("txt", t("serverinfo.numbers.embed.fields.4.value", { locale, data })),
                    inline: true,
                },
                {
                    name: t("serverinfo.numbers.embed.fields.5.name", locale),
                    value: codeBlock("txt", t("serverinfo.numbers.embed.fields.5.value", { locale, data })),
                    inline: false,
                },
                {
                    name: t("serverinfo.numbers.embed.fields.6.name", locale),
                    value: codeBlock("txt", `Max Members: ${data.others.maximumMembers}\nStreams Users Max: ${data.others.maxVideoChannelUsers}\nStage Users Max: ${data.others.maxStageChannelUsers}\nNSFW Level: ${data.others.nsfwLevel}\nAFK Timeout: ${data.others.afkTimeout}`),
                    inline: false,
                },
            ],
            footer: {
                text: `🆔 ${guild.id}`,
                icon_url: guild.iconURL() || "",
            },
        }],
        components: [components],
    }).catch(() => { });
}