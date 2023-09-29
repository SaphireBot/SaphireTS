import { ChatInputCommandInteraction, APIEmbedField, Colors, Routes, ButtonStyle } from "discord.js";
import { GiveawayManager } from "../../../../managers";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import client from "../../../../saphire";

export default async function infoGiveaway(interaction: ChatInputCommandInteraction<"cached">) {

    const { options, userLocale: locale } = interaction;

    const giveaway = GiveawayManager.cache.get(options.getString("giveaway") as string);
    if (!giveaway)
        return await interaction.reply({
            content: t("giveaway.not_found", { e, locale }),
            ephemeral: true
        });

    await interaction.reply({ content: e.Loading + " " + t("keyword_loading", { e, locale }) });

    const message = await giveaway.getMessage();
    if (!message)
        return await interaction.editReply({
            content: t("giveaway.not_found", { e, locale })
        });

    const fields: APIEmbedField[] = [
        {
            name: "🗺️ Localidade",
            value: `Sorteio registrado no canal ${giveaway.channel || `Not Found - \`${giveaway.ChannelId}\``}`
        },
        {
            name: `${e.Info} Informações Gerais`,
            value: `Este sorteio foi criado por <@${giveaway.CreatedBy}> \`${giveaway.CreatedBy}\`.\nGanhou o **emoji** ${giveaway?.Emoji} e conta com **${giveaway.Winners} ${giveaway.Winners > 1 ? "vencedores" : "vencedor(a)"}**${giveaway.Actived ? `\nNeste momento, este sorteio tem **${giveaway.Participants.size} participantes**` : ""}`,
        },
        {
            name: "⏱️ Tempo",
            value: `Ele foi criado no dia ${Date.toDiscordCompleteTime(giveaway.DateNow)}\ne ${giveaway.Actived ? "tem" : "teve"} exatos \`${Date.stringDate(giveaway.TimeMs, false, locale)}\` para os membros participarem.\n \nEste sorteio ${giveaway.Actived ? "será" : "foi"} sorteado precisamente no dia ${Date.toDiscordCompleteTime(giveaway.DateNow + giveaway.TimeMs)}`
        },
        {
            name: "📝 Prêmio",
            value: `${giveaway.Prize || "WTF? Nada aqui?"}`
        },
        {
            name: "👥 Participantes",
            value: `\`${giveaway.Winners}\` Vencedores & \`${giveaway.Participants.size.currency()}\` Participantes`
        }
    ];

    if (giveaway.requires)
        fields.push({
            name: `${e.Commands} Requisitos`,
            value: giveaway.requires || `${e.SaphireWhat} Era pra ter alguma coisa aqui...`
        });

    if (giveaway.Sponsor) {
        const user = await client.rest.get(Routes.user(giveaway.Sponsor))
            .then((u: any) => `${u?.username} \`${u?.id}\``)
            .catch(() => undefined);
        if (user)
            fields.push({
                name: "👤 Patrocinador",
                value: user
            });
    }

    const components = [{
        type: 1,
        components: [
            {
                type: 2,
                custom_id: JSON.stringify({ c: "giveaway", src: "delete", gwId: giveaway.MessageID }),
                emoji: e.Trash,
                label: "Deletar",
                style: ButtonStyle.Danger
            },
            {
                type: 2,
                custom_id: JSON.stringify({ c: "giveaway", src: "finish", gwId: giveaway.MessageID }),
                emoji: "📨",
                label: "Finalizar",
                style: ButtonStyle.Primary,
                disabled: !giveaway.Actived
            },
            {
                type: 2,
                custom_id: JSON.stringify({ c: "giveaway", src: "reset", gwId: giveaway.MessageID }),
                emoji: "🔄",
                label: "Resetar",
                style: ButtonStyle.Primary
            },
            {
                type: 2,
                custom_id: JSON.stringify({ c: "giveaway", src: "reroll", gwId: giveaway.MessageID }),
                emoji: e.Tada,
                label: "Reroll",
                style: ButtonStyle.Primary,
                disabled: !giveaway.Actived
            }
        ]
    }];

    const embed = message?.embeds?.[0]?.toJSON();
    return interaction.editReply({
        content: null,
        embeds: [{
            color: giveaway.color || Colors.Blue,
            title: `🔍 ${client.user?.username}'s Giveaway Info`,
            url: giveaway.MessageLink,
            description: `Informações do sorteio \`${giveaway.MessageID}\``,
            fields,
            image: {
                url: embed?.image?.url as string
            },
            footer: {
                text: interaction.user.id
            }
        }],
        components
    });
}