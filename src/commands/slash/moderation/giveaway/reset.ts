import { ButtonStyle, ChatInputCommandInteraction, DiscordAPIError, PermissionsBitField, Colors } from "discord.js";
import { DiscordPermissons } from "../../../../util/constants";
import permissionsMissing from "../../../functions/permissionsMissing";
import { GiveawayManager } from "../../../../managers";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { GuildSchema } from "../../../../database/models/guild";

export default async function (interaction: ChatInputCommandInteraction<"cached">, giveawayId: string | null) {

    const { member, userLocale: locale, guildLocale, guild } = interaction;

    if (!member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    if (guild.members.me?.permissions.missing([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], true).length)
        return await permissionsMissing(interaction, [DiscordPermissons.ViewChannel, DiscordPermissons.ReadMessageHistory], "Discord_client_need_some_permissions");

    if (!giveawayId)
        return await interaction.reply({
            content: t("giveaway.options.delete.id_source_not_found", { e, locale })
        });

    await interaction.reply({
        content: t("giveaway.options.reset.loading", { e, locale }),
        ephemeral: true
    });

    const giveaway = GiveawayManager.cache.get(giveawayId);
    if (!giveaway)
        return await interaction.editReply({
            content: t("giveaway.not_found", { e, locale })
        });

    const channel = await giveaway?.getChannel();
    if (!channel)
        return await interaction.editReply({
            content: t("giveaway.options.reset.channel_not_found", { e, locale })
        });

    const message = await giveaway.fetchMessage();

    if (message instanceof DiscordAPIError) {
        let response = "";
        if (message.code === 10008) {
            giveaway.delete();
            response = "Giveaway's message not found";
        } else console.log("#5345718%@", message);

        return await interaction.editReply({
            content: t("giveaway.options.reset.error_to_reset", { e, locale, err: response || message })
        });
    }

    if (!message)
        return await interaction.editReply({
            content: t("giveaway.options.reset.error_to_reset", { e, locale, err: "Giveaway's message not found" })
        });

    const embed = message.embeds?.[0];
    if (!embed)
        return await interaction.editReply({
            content: t("giveaway.options.reset.error_to_reset", { e, locale, err: "Message's embed not found" })
        });

    const field = embed.fields?.find(v => v?.name?.includes("⏳"));
    if (field) {
        field.name = t("giveaway.finish", { locale: guildLocale, date: Date.toDiscordTime(giveaway.TimeMs, Date.now(), "R") });
        field.value = `${Date.toDiscordTime(giveaway.TimeMs, Date.now(), "f")}`;
        field.inline = true;
    }

    embed.title = `${e.Tada} ${t("giveaway.giveawayKeyword", guildLocale)} ${interaction.guild.name}`;

    if (giveaway.message)
        await giveaway.message.delete().catch(() => { });

    const messageLoading = await giveaway.channel?.send({ content: `${e.Loading} | Giveaway Reseting System...` })
        .catch(() => undefined);

    if (messageLoading?.id) {
        embed.color = giveaway.color || Colors.Blue;
        if (embed.footer?.text)
            embed.footer.text = "ID: " + messageLoading?.id;
        const newGiveawayMessage = await messageLoading?.edit({
            content: null,
            embeds: [embed],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("giveaway.join", { locale: guildLocale, participants: 0 }),
                            emoji: (message.components?.[0].components?.[0] as any)?.emoji,
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
        }).catch(() => undefined);


        if (newGiveawayMessage?.id) {
            const giveawayData = {
                MessageID: newGiveawayMessage.id, // Id da Mensagem
                GuildId: guild.id, // Id do Servidor
                Prize: giveaway.Prize, // Prêmio do sorteio
                Winners: giveaway.Winners, // Quantidade vencedores
                WinnersGiveaway: [], // Vencedores do sorteio
                Participants: [], // Lugar dos participantes
                Emoji: giveaway.Emoji, // Emoji do botão de Participar
                TimeMs: giveaway.TimeMs, // Tempo do Sorteio
                DateNow: Date.now(), // Agora
                ChannelId: giveaway.ChannelId, // Id do Canal
                Actived: true, // Ativado
                MessageLink: newGiveawayMessage.url, // Link da mensagem
                CreatedBy: giveaway.CreatedBy, // Quem fez o sorteio,
                Sponsor: giveaway.Sponsor, // Quem fez o sorteio,
                AllowedRoles: giveaway.AllowedRoles, // Cargos que podem participar
                LockedRoles: giveaway.LockedRoles, // Cargos que não podem participar
                AllowedMembers: giveaway.AllowedMembers, // Usuários que podem participar
                LockedMembers: giveaway.LockedMembers, // Usuários que não podem participar
                RequiredAllRoles: giveaway.RequiredAllRoles, // Todos os cargos AllowedRoles são obrigatórios
                AddRoles: giveaway.AddRoles, // Cargos que serão adicionados ao vencedores
                MultipleJoinsRoles: giveaway.MultipleJoinsRoles, // Cargos com entradas adicionais
                MinAccountDays: giveaway.MinAccountDays, // Número mínimo de dias com a conta criada
                MinInServerDays: giveaway.MinInServerDays // Número mínimo de dias dentro do servidor
            };

            giveaway.delete();

            const data = await Database.Guilds.findOneAndUpdate(
                { id: guild.id },
                { $push: { Giveaways: giveawayData } }
            )
                .catch(async err => {
                    await interaction.editReply({
                        content: t("giveaway.options.reset.error_to_reset", { e, locale, err })
                    });
                    return null;
                }) as GuildSchema | null;

            if (data === null) return;

            GiveawayManager.set(giveawayData);

            return await interaction.editReply({
                content: t("giveaway.options.reset.success", { e, locale }),
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("giveaway.giveawayKeyword", locale),
                            url: newGiveawayMessage.url,
                            style: ButtonStyle.Link
                        }
                    ]
                }]
            });
        }
    }

    return await interaction.editReply({
        content: t("giveaway.options.reset.fail", { e, locale })
    });
}
