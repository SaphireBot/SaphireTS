import { StringSelectMenuInteraction, ButtonStyle, codeBlock, Colors, TextChannel, Guild, GuildMember } from "discord.js";
import { e } from "../../../util/json.js";
import { locales } from "../../../util/constants.js";
import { t } from "../../../translator/index.js";

export default async function suplement(interaction: StringSelectMenuInteraction<"cached">, guild: Guild) {

    const { userLocale: locale, user } = interaction;
    const indexComponent = interaction.message.components.length > 1 ? 1 : 0;
    const selectMenu = interaction.message.components[indexComponent].toJSON();

    await interaction.update({
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: t("serverinfo.suplements.loading", locale),
                emoji: e.Loading,
                custom_id: "loading",
                style: ButtonStyle.Secondary,
                disabled: true
            }].asMessageComponents()
        }]
    }).catch(() => { });

    const userInTheGuild = guild.id === interaction.guild.id
        ? true
        : await guild.members.fetch(user.id).then(() => true).catch(() => false);

    const owner = await guild.fetchOwner().catch(() => null) as GuildMember | null;

    const data = {
        afkChannel: guild.afkChannel ? `${userInTheGuild ? `${guild.afkChannel} (${Date.stringDate(guild.afkTimeout * 1000, false, locale)})\n\`${guild.afkChannelId}\`` : codeBlock("txt", `${guild.afkChannel.name}(${Date.stringDate(guild.afkTimeout * 1000, false, locale)})\n${guild.afkChannelId}`)}` : codeBlock("txt", t("serverinfo.suplements.no_channel", locale)),
        publicUpdatesChannel: formatChannel(guild.publicUpdatesChannel, guild.publicUpdatesChannelId),
        rulesChannel: formatChannel(guild.rulesChannel, guild.rulesChannelId),
        systemChannel: formatChannel(guild.systemChannel, guild.systemChannelId),
        defaultMessageNotifications: {
            0: t("serverinfo.suplements.all_messages", locale),
            1: t("serverinfo.suplements.only_mentions", locale),
        }[guild.defaultMessageNotifications],
        explicitContentFilter: {
            0: t("serverinfo.suplements.disabled", locale),
            1: t("serverinfo.suplements.members_without_roles", locale),
            2: t("serverinfo.suplements.all_members", locale)
        }[guild.explicitContentFilter],
        nameAndId: `${guild.name} \n${guild.id} `,
        ownerAndId: `${owner?.user?.username || "Not Found"} \n${guild.ownerId} `,
        large: guild.large ? t("serverinfo.suplements.yes", locale) : t("serverinfo.suplements.no", locale),
        mfaLevel: guild.mfaLevel ? t("serverinfo.suplements.actived", locale) : t("serverinfo.suplements.disabled", locale),
        nameAcronym: guild.nameAcronym ? guild.nameAcronym : t("serverinfo.suplements.do_not_have", locale),
        nsfwLevel: {
            0: t("serverinfo.suplements.default", locale),
            1: t("serverinfo.suplements.explict", locale),
            2: t("serverinfo.suplements.safe", locale),
            3: t("serverinfo.suplements.restricted", locale),
        }[guild.nsfwLevel],
        partnered: guild.partnered ? t("serverinfo.suplements.yes", locale) : t("serverinfo.suplements.no", locale),
        preferredLocale: locales[guild.preferredLocale as keyof typeof locales] || guild.preferredLocale,
        premiumProgressBarEnabled: guild.premiumProgressBarEnabled ? "Ativado" : "Desativado",
        vanityURLCode: guild.vanityURLCode ? guild.vanityURLCode : "Nenhum Código",
        verificationLevel: {
            0: t("serverinfo.suplements.none", locale),
            1: t("serverinfo.suplements.low", locale),
            2: t("serverinfo.suplements.medium", locale),
            3: t("serverinfo.suplements.high", locale),
            4: t("serverinfo.suplements.higher", locale),
        }[guild.verificationLevel],
        verified: guild.verified ? t("serverinfo.suplements.yes", locale) : t("serverinfo.suplements.no", locale)
    };

    const fields = [
        {
            name: t("serverinfo.suplements.fields.0", locale),
            value: data.afkChannel,
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.1", locale),
            value: data.publicUpdatesChannel,
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.2", locale),
            value: data.rulesChannel,
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.3", locale),
            value: data.systemChannel,
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.4", locale),
            value: codeBlock("txt", data.nameAndId),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.5", { e, locale }),
            value: codeBlock("txt", data.ownerAndId),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.6", { e, locale }),
            value: codeBlock("txt", data.defaultMessageNotifications),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.7", locale),
            value: codeBlock("txt", data.explicitContentFilter),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.8", locale),
            value: codeBlock("txt", data.large),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.9", locale),
            value: codeBlock("txt", data.mfaLevel),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.10", locale),
            value: codeBlock("txt", data.nameAcronym),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.11", locale),
            value: codeBlock("txt", data.nsfwLevel),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.12", { e, locale }),
            value: codeBlock("txt", data.partnered),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.13", locale),
            value: codeBlock("txt", data.preferredLocale),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.14", locale),
            value: codeBlock("txt", data.premiumProgressBarEnabled),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.15", locale),
            value: codeBlock("txt", data.vanityURLCode),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.16", locale),
            value: codeBlock("txt", data.verificationLevel),
            inline: true
        },
        {
            name: t("serverinfo.suplements.fields.17", locale),
            value: codeBlock("txt", data.verified),
            inline: true
        }
    ];

    const embed = {
        color: Colors.Blue,
        title: t("serverinfo.suplements.title", locale),
        description: t("serverinfo.suplements.description", { locale, e }),
        fields,
        footer: {
            text: `🆔 ${guild.id} `,
            icon_url: guild.iconURL() || ""
        }
    };

    function formatChannel(channel: TextChannel | null, channelId: string | null) {
        return channel
            ? `${userInTheGuild ? `${channel}\n\`${channel}\`` : codeBlock("txt", `${channel.name}\n${channelId}`)}`
            : codeBlock("txt", t("serverinfo.suplements.no_channel", locale));
    }

    return await interaction.editReply({ embeds: [embed], components: [selectMenu] }).catch(() => { });
}