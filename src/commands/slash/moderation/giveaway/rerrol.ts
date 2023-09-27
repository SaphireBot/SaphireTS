import { ChatInputCommandInteraction, APIEmbedField, ButtonStyle, PermissionsBitField, StringSelectMenuInteraction, Colors } from "discord.js";
import permissionsMissing from "../../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../../util/constants";
import { e } from "../../../../util/json";
import { GiveawayManager } from "../../../../managers";
import { t } from "../../../../translator";

export default async function giveawayreroll(
    interaction: ChatInputCommandInteraction<"cached"> | StringSelectMenuInteraction<"cached">,
    giveawayId: string | null,
    winners?: number
) {

    const { member, userLocale: locale } = interaction;

    if (!member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    let messageId: string | null = giveawayId;

    if (interaction.isChatInputCommand()) {
        messageId = interaction.options.getString("giveaway") || "";
        winners = interaction.options.getInteger("winners") || 0;
    } else {
        messageId = giveawayId || "";
    }

    if (!messageId)
        return await interaction.reply({ content: t("giveaway.reroll.no_giveaway_id_found", { e, locale }) });

    if (messageId === "info")
        return await interaction.reply({
            embeds: [{
                color: Colors.Blue,
                title: `${e.Info} | Informações Gerais Do Sistema de Reroll`,
                fields: [
                    {
                        name: "💬 Em qual canal?",
                        value: "O meu sistema foi projetado para efetuar rerolls em qualquer canal do Servidor."
                    },
                    {
                        name: "✍ Escolha o sorteio",
                        value: "Se o servidor tiver sorteios disponíveis para reroll, aparecerá automaticamente em uma lista automática na tag `id`."
                    },
                    {
                        name: "👥 Vencedores",
                        value: "Você pode escolher de 1 a 20 vencedores para um reroll.\nSe o número de vencedores não for informado, a quantidade de usuários sorteados será a mesma do sorteio original."
                    },
                    {
                        name: "🔢 Quantos rerolls posso fazer?",
                        value: "Meu sistema fornece rerolls infinitos para todos os servidores gratuitamentes."
                    },
                    {
                        name: "🔑 Quais sorteios estão disponíveis para Reroll?",
                        value: "1. Sorteios já sorteados.\n2. Sorteios com mais de 1 participante"
                    }
                ]
            }]
        });

    const giveaway = GiveawayManager.cache.get(messageId);

    if (!giveaway)
        return await interaction.reply({ content: t("giveaway.reroll.any_giveaway_found", { e, locale }) });

    if (giveaway.Actived)
        return await interaction.reply({
            content: t("giveaway.reroll.still_active", { e, locale })
        });

    if (!giveaway.Participants.size)
        return await interaction.reply({
            content: t("giveaway.reroll.giveaway_without_participants", { e, locale })
        });

    if (!winners)
        winners = giveaway.Winners;

    if (winners > giveaway.Participants.size)
        winners = giveaway.Participants.size;

    await interaction.reply({ content: t("giveaway.reroll.iniciating", { e, locale }), ephemeral: true });

    let toMention: string | string[] = Array.from(giveaway.Participants)
        // .filter(id => !giveaway.WinnersGiveaway.includes(id))
        .random(winners);

    if (typeof toMention === "string")
        toMention = [toMention];

    if (!toMention?.length)
        return await interaction.editReply({
            content: t("giveaway.reroll.no_winners_catched", { e, locale })
        });

    if (giveaway.AddRoles.length) {
        const guildMember = await interaction.guild.members.fetch()
            .then(members => {
                members.sweep((_, id) => !toMention.includes(id));
                return members;
            });

        for (const member of guildMember)
            member[1]?.roles.add(giveaway.AddRoles).catch(() => { });
    }

    const toMentionMapped = toMention.map(userId => `🎉 <@${userId}> \`${userId}\``);

    const giveawayMessageFields: APIEmbedField[] = [
        {
            name: `${e.Reference} ${t("giveaway.giveawayKeyword", locale)}`,
            value: t("giveaway.link_reference", {
                locale,
                link: giveaway?.MessageLink?.length ? `🔗 [${t("giveaway.link", locale)}](${giveaway.MessageLink})` : t("giveaway.lost_reference", locale) + `\n🆔 *\`${giveaway?.MessageID}\`*`
            }),
            inline: true
        },
        {
            name: t("giveaway.prize", { e, locale }),
            value: giveaway?.Prize as string,
            inline: true
        }
    ];

    const replyData = {} as any;

    if (giveaway?.ChannelId === interaction.channelId)
        replyData.reply = {
            failIfNotExists: false,
            messageReference: messageId
        };

    const contents: string[] = [];

    for (let i = 0; i < toMention.length; i += 4)
        contents.push(toMentionMapped.slice(i, i + 4).join("\n"));

    let errors = 0;
    for await (const content of contents)
        await interaction.channel?.send(Object.assign(replyData, { content }))
            .catch(() => errors++);

    if (errors > 0)
        await interaction.channel?.send({ content: `${e.bug} | Error to send ${errors} messages in this channel` });

    await interaction.channel?.send({
        content: giveaway?.CreatedBy ? `${e.Notification} <@${giveaway.CreatedBy}>` : giveaway?.Sponsor ? `<@${giveaway.Sponsor}>` : undefined,
        embeds: [{
            color: Colors.Green,
            title: `${e.Tada} ${t("giveaway.finished", locale)} [REROLL]`,
            url: giveaway?.MessageLink,
            fields: giveawayMessageFields,
            footer: {
                text: `${toMention.length}/${giveaway?.Winners} ${t("giveaway.drawn_participants", locale)}`
            }
        }],
        components: [{
            type: 1,
            components: [

                {
                    type: 2,
                    label: t("giveaway.reroll.components.original", interaction.guildLocale),
                    emoji: "🔗",
                    url: giveaway.MessageLink,
                    style: ButtonStyle.Link
                },
                {
                    type: 2,
                    label: t("giveaway.reroll.components.participants", { locale: interaction.guildLocale, participants: giveaway.Participants.size }),
                    emoji: "👥",
                    customId: "participants",
                    style: ButtonStyle.Primary,
                    disabled: true
                },
                {
                    type: 2,
                    label: t("giveaway.data_and_participants", locale),
                    emoji: e.Animated.SaphireReading,
                    custom_id: JSON.stringify({ c: "giveaway", src: "list", gwId: giveaway?.MessageID }),
                    style: ButtonStyle.Primary
                }
            ]
        }].asMessageComponents()
    });

    if (giveaway?.AddRoles.length)
        await interaction.channel?.send({
            content: t("giveaway.role_handed_out", {
                e,
                locale,
                addRoles: giveaway.AddRoles.length
            }),
            embeds: [
                {
                    color: Colors.Green,
                    description: giveaway.AddRoles.map(roleId => `<@&${roleId}>`).join(", ").limit("MessageEmbedDescription"),
                    footer: {
                        text: t("giveaway.all_role_handed_out_success", locale)
                    }
                }
            ]
        });

    return await interaction.editReply({ content: t("giveaway.reroll.complete", { e, locale }) });

}