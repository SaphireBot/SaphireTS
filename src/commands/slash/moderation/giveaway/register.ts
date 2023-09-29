import { APIUser, ChatInputCommandInteraction, Message, Routes, ButtonStyle, APIEmbed, APIEmbedField, ForumChannel, VoiceChannel, PublicThreadChannel, TextChannel, PrivateThreadChannel, StageChannel, NewsChannel, CategoryChannel } from "discord.js";
import { GiveawayType as GiveawayModelType } from "../../../../@types/models";
import client from "../../../../saphire";
import { GiveawayCollectorData } from "../../../../@types/commands";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { GiveawayManager } from "../../../../managers";
import { t } from "../../../../translator";

export default async function register(
    interaction: ChatInputCommandInteraction<"cached">,
    configurationMessage: Message<true>,
    giveawayMessage: Message<true>,
    collectorData: GiveawayCollectorData,
    channel: CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null | undefined,
    color?: number,
    giveawayResetedData?: GiveawayModelType
) {

    if (!interaction.guild) return;

    const { user, guild, options, guildLocale, userLocale: locale } = interaction;

    const sponsor: APIUser | undefined = giveawayResetedData
        ? await client.rest.get(Routes.user(giveawayResetedData?.Sponsor)).catch(() => undefined) as APIUser
        : interaction.options.getUser("sponsor")?.toJSON() as APIUser;

    const prize = giveawayResetedData ? giveawayResetedData?.Prize : options.getString("prize") || "";
    const duration = giveawayResetedData ? giveawayResetedData?.TimeMs : options.getString("duration")?.toDateMS() || 0;
    const minAccountDays = giveawayResetedData ? giveawayResetedData?.MinAccountDays : options.getInteger("account_days") || 0;
    const minInServerDays = giveawayResetedData ? giveawayResetedData?.MinInServerDays : options.getInteger("server_days") || 0;
    const requires = giveawayResetedData ? giveawayResetedData?.Requires : options.getString("requires");
    const imageURL = giveawayResetedData ? giveawayResetedData?.imageUrl : options.getString("imageurl");
    const WinnersAmount = giveawayResetedData ? giveawayResetedData?.Winners || 1 : options.getInteger("winners") || 1;

    const giveawayData = {
        MessageID: giveawayMessage.id, // Id da Mensagem
        GuildId: guild.id, // Id do Servidor
        Prize: prize, // Prêmio do sorteio
        Winners: WinnersAmount, // Quantidade vencedores
        WinnersGiveaway: [], // Vencedores do sorteio
        Participants: [], // Lugar dos participantes
        Emoji: collectorData.reaction, // Emoji do botão de Participar
        TimeMs: duration, // Tempo do Sorteio
        DateNow: Date.now(), // Agora
        ChannelId: channel?.id, // Id do Canal
        Actived: false, // Ativado
        MessageLink: giveawayMessage.url, // Link da mensagem
        CreatedBy: user.id, // Quem fez o sorteio,
        Sponsor: sponsor?.id, // Quem fez o sorteio,
        AllowedRoles: collectorData.AllowedRoles, // Cargos que podem participar
        LockedRoles: collectorData.LockedRoles, // Cargos que não podem participar
        AllowedMembers: collectorData.AllowedMembers, // Usuários que podem participar
        LockedMembers: collectorData.LockedMembers, // Usuários que não podem participar
        RequiredAllRoles: collectorData.RequiredAllRoles, // Todos os cargos AllowedRoles são obrigatórios
        AddRoles: collectorData.AddRoles, // Cargos que serão adicionados ao vencedores
        MultipleJoinsRoles: Array.from(collectorData.MultJoinsRoles.values()).map(r => ({ id: r.role.id, joins: r.joins || 1 })) || [], // Cargos com entradas adicionais
        MinAccountDays: minAccountDays, // Número mínimo de dias com a conta criada
        MinInServerDays: minInServerDays, // Número mínimo de dias dentro do servidor
        color,
        requires
    };

    await Database.Guilds.updateOne(
        { id: guild.id },
        { $push: { Giveaways: giveawayData } }
    );

    const serverDaysText = minInServerDays > 0 ? t("giveaway.min_server_days", { e, locale: guildLocale, minInServerDays: minInServerDays.currency() }) : "";
    const accountDaysText = minAccountDays > 0 ? t("giveaway.min_account_days", { e, locale: guildLocale, minInServerDays: minAccountDays.currency() }) : "";

    const embed: APIEmbed & { fields: APIEmbedField[] } = {
        color: color || 0x0099ff,
        title: `${e.Tada} ${t("giveaway.giveawayKeyword", guildLocale)} ${guild.name}`,
        description: t("giveaway.to_enter_click", guildLocale),
        fields: [
            {
                name: t("giveaway.prize", { e, locale: guildLocale }),
                value: `> ${prize}`,
                inline: true
            },
            {
                name: t("giveaway.winners", { e, locale: guildLocale }),
                value: `> ${WinnersAmount}`,
                inline: true
            },
            {
                name: t("giveaway.finish", { locale: guildLocale, date: Date.toDiscordTime(duration, Date.now(), "R") }),
                value: `${Date.toDiscordTime(duration, Date.now(), "f")}`,
                inline: true
            }
        ],
        image: typeof imageURL === "string" ? { url: imageURL } : undefined,
        footer: { text: `ID: ${giveawayMessage?.id}${serverDaysText}${accountDaysText}` }
    };

    if (sponsor?.id)
        embed.fields.splice(
            1, 0,
            {
                name: t("giveaway.sponsoredBy", { e, locale: guildLocale }),
                value: `> ${sponsor?.username}\n\`${sponsor.id || 0}\``,
                inline: true
            }
        );

    if (requires)
        embed.fields.push({
            name: t("giveaway.requires", { e, locale: guildLocale }),
            value: `${requires}`.limit("MessageEmbedFooterText")
        });

    if (collectorData.AllowedMembers.length)
        embed.fields.push({
            name: t("giveaway.members_allowed", { locale: guildLocale, AllowedMembers: collectorData.AllowedMembers.length }),
            value: collectorData.AllowedMembers.map(userId => `<@${userId}>`).join(", ") || t("giveaway.nobody_here", guildLocale)
        });

    if (collectorData.LockedMembers.length)
        embed.fields.push({
            name: t("giveaway.locked_members", { locale: guildLocale, LockedMembers: collectorData.LockedMembers.length }),
            value: collectorData.LockedMembers.map(userId => `<@${userId}>`).join(", ") || t("giveaway.nobody_here", guildLocale)
        });

    if (collectorData.AllowedRoles.length)
        embed.fields.push({
            name: collectorData.RequiredAllRoles
                ? t("giveaway.required_roles", { locale: guildLocale, AllowedRoles: collectorData.AllowedRoles.length })
                : t("giveaway.have_a_role", { locale: guildLocale, AllowedRoles: collectorData.AllowedRoles.length }),
            value: collectorData.AllowedRoles.map(rolesId => `<@&${rolesId}>`).join(", ") || t("giveaway.nobody_here", guildLocale)
        });

    if (collectorData.LockedRoles.length)
        embed.fields.push({
            name: t("giveaway.locked_roles_count", { locale: guildLocale, LockedRoles: collectorData.LockedRoles.length }),
            value: collectorData.LockedRoles.map(rolesId => `<@&${rolesId}>`).join(", ") || t("giveaway.nobody_here", guildLocale)
        });

    if (collectorData.AddRoles.length)
        embed.fields.push({
            name: t("giveaway.roles_to_winners", { locale: guildLocale, AddRoles: collectorData.AddRoles.length }),
            value: collectorData.AddRoles.map(rolesId => `<@&${rolesId}>`).join(", ") || t("giveaway.nobody_here", guildLocale)
        });

    if (collectorData.MultJoinsRoles.size)
        embed.fields.push({
            name: t("giveaway.multiple_roles", guildLocale),
            value: Array.from(collectorData.MultJoinsRoles.values()).map(r => `**${r.joins || 1}x** <@&${r.role.id}>`).join("\n") || t("giveaway.nobody_here", guildLocale)
        });

    const giveaway = await GiveawayManager.set(giveawayData as any);
    return giveawayMessage.edit({
        content: null,
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: t("giveaway.join", { locale: guildLocale, participants: 0 }),
                        emoji: collectorData.reaction,
                        custom_id: JSON.stringify({ c: "giveaway", src: "join" }),
                        style: ButtonStyle.Success
                    },
                    {
                        type: 2,
                        label: t("giveaway.data_and_participants", guildLocale),
                        emoji: e.Commands,
                        custom_id: JSON.stringify({ c: "giveaway", src: "list" }),
                        style: ButtonStyle.Primary
                    }
                ]
            }
        ].asMessageComponents()
    })
        .then(async () => {
            configurationMessage.reactions.removeAll().catch(() => { });
            return await configurationMessage.edit({
                content: `${e.Check} | ${giveawayResetedData ? t("giveaway.reseted", locale) : t("giveaway.created", locale)} ` + t("giveaway.with_success", locale),
                embeds: [],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("giveaway.giveawayKeyword", locale),
                                emoji: "🔗",
                                url: giveawayMessage.url,
                                style: ButtonStyle.Link
                            },
                            {
                                type: 2,
                                label: t("giveaway.delete_message", locale),
                                emoji: e.Trash,
                                custom_id: JSON.stringify({ c: "delete" }),
                                style: ButtonStyle.Danger
                            },
                        ]
                    }
                ].asMessageComponents()
            })
                .catch(async err => {
                    giveaway?.delete();
                    giveawayMessage.delete().catch(() => { });
                    return await interaction.channel?.send({
                        content: t("giveaway.error_but_success", { e, locale: locale, err }),
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: t("giveaway.giveawayKeyword", locale),
                                emoji: "🔗",
                                url: giveawayMessage.url,
                                style: ButtonStyle.Link
                            }]
                        }]
                    }).catch(() => { });
                });
        })
        .catch(async err => {
            giveaway?.delete();
            giveawayMessage.delete().catch(() => { });
            const content = {
                10008: t("giveaway.error.10008", locale),
                50035: t("giveaway.error.50035", locale),
                10003: t("giveaway.error.10003", locale),
            }[err.code as number] || t("giveaway.error.another", { locale, err });

            return await configurationMessage.edit({ content, embeds: [], components: [] }).catch(() => { });
        });

}