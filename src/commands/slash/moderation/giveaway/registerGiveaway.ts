import { APIUser, ChatInputCommandInteraction, Message, Routes, ButtonStyle, APIEmbed, APIEmbedField, ForumChannel, VoiceChannel, PublicThreadChannel, TextChannel, PrivateThreadChannel, StageChannel, NewsChannel, CategoryChannel } from "discord.js";
import { GiveawayType as GiveawayModelType } from "../../../../@types/models";
import client from "../../../../saphire";
import { GiveawayCollectorData } from "../../../../@types/commands";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { GiveawayManager } from "../../../../managers";

export default async function registerGiveaway(
    interaction: ChatInputCommandInteraction<"cached">,
    configurationMessage: Message<true>,
    giveawayMessage: Message<true>,
    collectorData: GiveawayCollectorData,
    channel: CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null | undefined,
    color?: number,
    giveawayResetedData?: GiveawayModelType
) {

    if (!interaction.guild) return;

    const { user, guild, options } = interaction;

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
    };

    await Database.Guilds.updateOne(
        { id: guild.id },
        { $push: { Giveaways: giveawayData } }
    );

    const serverDaysText = minInServerDays > 0 ? `\nPrecisa estar no servidor a ${minInServerDays.currency()} dias` : "";
    const accountDaysText = minAccountDays > 0 ? `\nPrecisa ter a conta criada a ${minAccountDays.currency()} dias` : "";

    const embed: APIEmbed & { fields: APIEmbedField[] } = {
        color: color || 0x0099ff,
        title: `${e.Tada} Sorteios ${guild.name}`,
        description: "Para entrar no sorteio, basta clicar em `Participar`",
        fields: [
            {
                name: `${e.Star} Prêmio`,
                value: `> ${prize}`,
                inline: true
            },
            {
                name: `${e.CoroaDourada} Vencedores`,
                value: `> ${WinnersAmount}`,
                inline: true
            },
            {
                name: `⏳ Término ${Date.toDiscordTime(duration, Date.now(), "R")}`,
                value: `${Date.toDiscordTime(duration, Date.now(), "f")}`,
                inline: true
            }
        ],
        image: typeof imageURL === "string" ? { url: imageURL } : undefined,
        footer: { text: `Giveaway ID: ${giveawayMessage?.id}${serverDaysText}${accountDaysText}` }
    };

    if (sponsor?.id)
        embed.fields.splice(
            1, 0,
            {
                name: `${e.ModShield} Patrocinado por`,
                value: `> ${sponsor?.username}\n\`${sponsor.id || 0}\``,
                inline: true
            }
        );

    if (requires)
        embed.fields.push({
            name: `${e.Commands} Requisitos`,
            value: `${requires}`.limit("MessageEmbedFooterText")
        });

    if (collectorData.AllowedMembers.length)
        embed.fields.push({
            name: `👥 Membros Permitidos (${collectorData.AllowedMembers.length})`,
            value: collectorData.AllowedMembers.map(userId => `<@${userId}>`).join(", ") || "Ninguém? Vish..."
        });

    if (collectorData.LockedMembers.length)
        embed.fields.push({
            name: `🚫 Membros Bloqueados (${collectorData.LockedMembers.length})`,
            value: collectorData.LockedMembers.map(userId => `<@${userId}>`).join(", ") || "Ninguém? Vish..."
        });

    if (collectorData.AllowedRoles.length)
        embed.fields.push({
            name: collectorData.RequiredAllRoles
                ? `🔰 Cargos Obrigatórios (${collectorData.AllowedRoles.length})`
                : `🔰 Possuir um dos ${collectorData.AllowedRoles.length} cargos`,
            value: collectorData.AllowedRoles.map(rolesId => `<@&${rolesId}>`).join(", ") || "Nenhum? Vish..."
        });

    if (collectorData.LockedRoles.length)
        embed.fields.push({
            name: `🚫 Cargos Bloqueados (${collectorData.LockedRoles.length})`,
            value: collectorData.LockedRoles.map(rolesId => `<@&${rolesId}>`).join(", ") || "Nenhum? Vish..."
        });

    if (collectorData.AddRoles.length)
        embed.fields.push({
            name: `👑 Cargos Para os Vencedores (${collectorData.AddRoles.length})`,
            value: collectorData.AddRoles.map(rolesId => `<@&${rolesId}>`).join(", ") || "Nenhum? Vish..."
        });

    if (collectorData.MultJoinsRoles.size)
        embed.fields.push({
            name: "✨ Cargos Multiplicadores",
            value: Array.from(collectorData.MultJoinsRoles.values()).map(r => `**${r.joins || 1}x** <@&${r.role.id}>`).join("\n") || "Nenhum? Vish..."
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
                        label: "Participar (0)",
                        emoji: collectorData.reaction,
                        custom_id: JSON.stringify({ c: "giveaway", src: "join" }),
                        style: ButtonStyle.Success
                    },
                    {
                        type: 2,
                        label: "Dados & Participantes",
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
                content: `${e.Check} | ${giveawayResetedData ? "Sorteio resetado" : "Sorteio criado"} com sucesso!`,
                embeds: [],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "Sorteio",
                                emoji: "🔗",
                                url: giveawayMessage.url,
                                style: ButtonStyle.Link
                            },
                            {
                                type: 2,
                                label: "Ok, deletar esta mensagem",
                                emoji: e.Trash,
                                custom_id: JSON.stringify({ c: "delete" }),
                                style: ButtonStyle.Danger
                            },
                        ]
                    }
                ].asMessageComponents()
            })
                .catch(err => {
                    giveaway?.delete();
                    giveawayMessage.delete().catch(() => { }); interaction.channel?.send({
                        content: `${e.Check} | Não consegui editar a mensagem original, então estou vindo aqui dizer que o sorteio foi criado com sucesso, ok?\n${e.bug} | \`${err}\``,
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: "Sorteio",
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
                10008: "⚠️ | A mensagem de origem foi deletada ou tomou uma origem desconhecida. Por favor, tente novamente.",
                50035: "⚠️ | Erro ao criar o sorteio.\nℹ | O link de imagem fornecido não é compátivel com as embeds do Discord.",
                10003: "⚠️ | O canal é desconhecido... Isso é estranho...",
            }[err.code as number] || `⚠️ | Erro ao criar o sorteio. | \`${err}\``;

            return await configurationMessage.edit({ content, embeds: [], components: [] }).catch(() => { });
        });

}