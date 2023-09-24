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

    await interaction.reply({
        content: t("giveaway.loading_new_giveaway", { e, locale })
    });

    const guild = await interaction.guild.fetch().catch(() => null);
    if (!guild)
        return await interaction.reply({
            content: t("giveaway.no_guild_data", { e, locale })
        });

    const prize = giveawayResetedData ? giveawayResetedData?.Prize : options.getString("prize");
    const duration = giveawayResetedData ? giveawayResetedData?.TimeMs : options.getString("duration")?.toDateMS() || 0;

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
                title: `⏱️ | ${client.user?.username}'s Time System`,
                description: "O meu sistema de tempo transforma o que você escreve em uma data.\nEle suporta 7 tipos diferentes de tempo escrito.",
                fields: [
                    {
                        name: "📝 Formas de Escrita",
                        value: "> `a - h - m - s` - Ano, Hora, Minuto, Segundo\n \n> `1h 10m 40s` - `1m 10s` - `2h 10m`\n \n> `2 dias 10 minutos 5 segundos`\n \n> `30/01/2022 14:35:25` *Os segundos são opcionais*\n \n> `hoje 14:35` - `amanhã 14:35`\n \n> `09:10` - `14:35` - `30/01/2022` - `00:00`\n \n> `domingo 11:00` - `segunda` - `terça-feira 17:00`"
                    },
                    {
                        name: `${e.QuestionMark} Status`,
                        value: duration <= 0 ? "O tempo definido não pode estar no passado" : "Tempo definido de forma incorreta"
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

    const color = giveawayResetedData ? giveawayResetedData?.color : Colors[options.getString("color") as keyof typeof Colors || "Blue"] || Colors.Blue;
    const msg = await channel.send({ embeds: [{ color: color, title: `${e.Loading} Construindo sorteio...` }] }).catch(() => null);

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
        ]
    };

    return await interaction.editReply({ content: null, embeds: [embed] })
        .then(message => message?.react("🎉")
            .then(() => collectReactionAndStartGiveawayConfiguration(interaction, message, msg, embed, channel, giveawayResetedData, color))
            .catch(async err => {
                console.log(err);
                msg.delete().catch(() => { });
                return await interaction.channel?.send({ content: `${e.DenyX} | Não foi possível obter a mensagem de origem.` });
            })
        )
        .catch(async err => {
            console.log(err);
            msg.delete().catch(() => { });
            return await interaction.channel?.send({ content: `${e.DenyX} | Houve um erro na origem do sorteio.\n${e.bug} | \`${err}\`` });
        });

}