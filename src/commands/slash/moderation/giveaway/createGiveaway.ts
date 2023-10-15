import { ChannelType, ChatInputCommandInteraction, Colors, PermissionFlagsBits, PermissionsBitField, APIEmbed } from "discord.js";
import { DiscordPermissons } from "../../../../util/constants";
import permissionsMissing from "../../../functions/permissionsMissing";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { GiveawayType } from "../../../../@types/models";
import client from "../../../../saphire";
import { env } from "process";
import collectReactionAndStartGiveawayConfiguration from "./collector";

export default async function createGiveaway(interaction: ChatInputCommandInteraction<"cached">, giveawayResetedData?: GiveawayType) {

    if (!interaction.member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    const { options, userLocale: locale } = interaction;
    if (!interaction.guild) return;

    if (giveawayResetedData)
        await interaction.editReply({
            content: t("giveaway.loading_new_giveaway", { e, locale })
        });
    else await interaction.reply({
        content: t("giveaway.loading_new_giveaway", { e, locale })
    });

    const guild = await interaction.guild.fetch().catch(() => null);
    if (!guild)
        return await interaction.editReply({
            content: t("giveaway.no_guild_data", { e, locale })
        });

    const prize = giveawayResetedData ? giveawayResetedData?.Prize : options.getString("prize");
    const duration = giveawayResetedData ? giveawayResetedData?.TimeMs : options.getString("time")?.toDateMS() || 0;

    if (!prize || duration <= 0)
        return await interaction.editReply({
            content: t("giveaway.prize_or_duration_missing", { e, locale })
        });

    const channel = giveawayResetedData
        ? interaction.guild.channels.cache.get(giveawayResetedData?.ChannelId)
        : options.getChannel("channel") || interaction.channel;

    if (
        !channel
        || !("send" in channel)
        || !("permissionsFor" in channel)
        || typeof channel?.send !== "function"
        || typeof channel?.permissionsFor !== "function"
        || ![
            ChannelType.GuildAnnouncement,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.AnnouncementThread,
            ChannelType.GuildText,
            ChannelType.GuildForum,
            ChannelType.GuildVoice,
            ChannelType.GuildStageVoice
        ].includes(channel.type)
    )
        return await interaction.editReply({
            content: t("channel_type_invalid", { e, locale })
        });

    // I NEED THE BASIC PERMISSIONS!!!
    const channelPermissions = channel.permissionsFor(client.user?.id || env.SAPHIRE_ID, true);
    const missing = channelPermissions?.missing([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions], true);
    if (missing?.length)
        return await permissionsMissing(
            interaction,
            [DiscordPermissons.ViewChannel, DiscordPermissons.SendMessages, DiscordPermissons.EmbedLinks, DiscordPermissons.AddReactions],
            "Discord_client_need_some_permissions"
        );

    if (duration <= 0)
        return await interaction.editReply({
            embeds: [{
                color: Colors.Blue,
                title: t("System_default_time.title", locale),
                description: t("System_default_time.description", locale),
                fields: [
                    {
                        name: t("System_default_time.fields.0.name", locale),
                        value: t("System_default_time.fields.0.value", locale),
                    },
                    {
                        name: t("System_default_time.fields.1.name", { e, locale }),
                        value: duration <= 0 ? t("System_default_time.fields.1.value1", locale) : t("System_default_time.fields.1.value2", locale)
                    }
                ]
            }]
        });

    if (
        (Date.now() + duration) <= (Date.now() + 4000)
        || duration > 63115200000 // 2 Years
    )
        return await interaction.editReply({
            content: t("giveaway.duration_limit", { e, locale })
        });

    const color = giveawayResetedData ? giveawayResetedData?.color : options.getInteger("color") || Colors.Blue;
    const msg = await channel.send({ embeds: [{ color: color, title: t("giveaway.loading", { e, locale: interaction.guildLocale }) }] }).catch(() => null);

    if (!msg || !msg?.id)
        return await interaction.editReply({
            content: t("fail_to_get_message_id", { e, locale })
        });

    const embed: APIEmbed = {
        color,
        title: t("giveaway.loading_embed.title_1", { e, client, locale }),
        description: t("giveaway.loading_embed.description_1", locale),
        fields: [
            {
                name: t("giveaway.loading_embed.fields.0.name", locale),
                value: t("giveaway.loading_embed.fields.0.value", { e, locale })
            },
            {
                name: t("giveaway.loading_embed.fields.1.name", { e, locale }),
                value: t("giveaway.loading_embed.fields.1.value", locale)
            }
        ],
        footer: {
            text: "ID: " + msg.id
        }
    };

    return await interaction.editReply({ content: null, embeds: [embed] })
        .then(message => message?.react("🎉")
            .then(() => collectReactionAndStartGiveawayConfiguration(interaction, message, msg, embed, channel, giveawayResetedData, color))
            .catch(async err => {
                console.log(err);
                msg.delete().catch(() => { });
                return await interaction.channel?.send({ content: t("giveaway.origin_message_not_found", { e, locale }) });
            })
        )
        .catch(async err => {
            console.log(err);
            msg.delete().catch(() => { });
            return await interaction.channel?.send({ content: t("giveaway.origin_message_not_found", { e, locale, err }) });
        });

}