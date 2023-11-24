import { ChatInputCommandInteraction, APIEmbedField, Colors, Message, Routes, ButtonStyle, ButtonInteraction } from "discord.js";
import { GiveawayManager } from "../../../../managers";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import client from "../../../../saphire";

export default async function info(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true> | ButtonInteraction<"cached">,
    giveawayId?: string
) {

    const { userLocale: locale } = interactionOrMessage;
    const isMessage = interactionOrMessage instanceof Message;
    const id = isMessage || interactionOrMessage.isButton()
        ? giveawayId
        : interactionOrMessage.options.getString("giveaway");

    if (typeof id !== "string") {
        const content = t("giveaway.message.format.id_not_given", { e, locale });

        if (isMessage) return await interactionOrMessage.edit({ content });
        if (!isMessage && interactionOrMessage.isButton()) return await interactionOrMessage.update({ content });
        return await interactionOrMessage.reply({ content });
    }

    const giveaway = GiveawayManager.cache.get(id);
    if (!giveaway) {
        const content = t("giveaway.not_found", { e, locale });

        if (isMessage) return await interactionOrMessage.edit({ content });
        if (!isMessage && interactionOrMessage.isButton()) return await interactionOrMessage.update({ content });
        return await interactionOrMessage.reply({ content });
    }

    const content = e.Loading + " " + t("keyword_loading", { e, locale });
    const msg = isMessage
        ? await interactionOrMessage.edit({ content })
        : interactionOrMessage.isButton()
            ? await interactionOrMessage.update({ content, fetchReply: true })
            : await interactionOrMessage.reply({ content, fetchReply: true });


    const message = await giveaway.getMessage();
    if (!message)
        return await msg.edit({
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
    return await msg.edit({
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
                text: interactionOrMessage.member?.user.id as string
            }
        }],
        components
    });
}