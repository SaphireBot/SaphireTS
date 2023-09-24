import { Colors, APIEmbed, APIEmbedField, time, APIActionRowComponent, APIButtonComponent, GuildMember, Collection, ButtonStyle } from "discord.js";
import Giveaway from "./giveaway";
import { e } from "../../util/json";
import Database from "../../database";
import { setTimeout as sleep } from "node:timers/promises";

export default async function lauchGiveaway(giveaway: Giveaway) {

    const messageEmbed = giveaway.message.embeds[0];
    const fields: APIEmbedField[] = messageEmbed?.fields || [];
    const guild = giveaway.guild;
    const message = giveaway.message;
    const channel = giveaway.channel;
    if (!guild) return;

    const dateNow = Date.now();
    const embed: APIEmbed & { fields: APIEmbedField[] } = {
        color: Colors.Red,
        title: `${e.Tada} Sorteios ${guild.name} | Sorteio Encerrado`,
        fields: [
            {
                name: `${e.Trash} Exclusão`,
                value: `${time(new Date(Date.now() + 1000 * 60 * 60 * 24 * 20), "R")}`,
                inline: true
            }
        ]
    };

    if (fields?.length)
        embed.fields?.unshift(...fields);

    if (messageEmbed?.footer?.text)
        embed.footer = { text: messageEmbed?.footer?.text };

    const components = message.components?.[0]?.toJSON() as APIActionRowComponent<APIButtonComponent> | undefined;
    if (components) {
        components.components[0].disabled = true;
        components.components[0].label = `Participar (${giveaway.Participants.size})`;
        components.components[1].disabled = giveaway.Participants.size === 0;
        message.edit({ embeds: [embed], components: [components] });
    }

    if (!giveaway.Participants.size) {
        embed.fields.push({
            name: `${e.Info} Sorteio cancelado`,
            value: "Nenhum usuário entrou neste sorteio",
            inline: true
        });

        giveaway.channel?.send({
            embeds: [{
                color: Colors.Red,
                title: `${e.DenyX} Sorteio cancelado`,
                description: `${e.Deny} Sorteio cancelado por falta de participantes.\n🔗 ${giveaway.MessageLink?.length ? `[Giveaway Reference](${giveaway.MessageLink})` : "Link indisponível"}`
            }]
        });

        return giveaway.delete();
    }

    const members = await guild.members.fetch().catch(() => new Collection<string, GuildMember>()) || new Collection<string, GuildMember>();
    members.sweep((member, memberId) => member.user.bot || !giveaway.Participants.has(memberId));

    if (giveaway.AllowedRoles?.length) {
        if (giveaway.RequiredAllRoles)
            members.sweep((member) => !giveaway.AllowedMembers?.includes(member.id) && !member.roles.cache.hasAll(...giveaway.AllowedRoles));
        else members.sweep((member) => !giveaway.AllowedMembers?.includes(member.id) && !member.roles.cache.hasAny(...giveaway.AllowedRoles));
    }

    if (giveaway.LockedRoles?.length)
        members.sweep((member) => !member.roles.cache.hasAny(...giveaway.LockedRoles));

    const participants: string[] = Array.from(members.keys());

    if (giveaway.MultipleJoinsRoles?.length)
        for (const { id, joins } of giveaway.MultipleJoinsRoles)
            members.forEach((member, memberId) => {
                if (id && member.roles.cache.has(id)) {
                    const array: string[] = new Array(joins).fill(memberId);
                    participants.push(...array);
                }
            });

    let winners: string | string[] = participants.random(giveaway.Winners) || [];

    if (typeof winners === "string")
        winners = [winners];

    members.sweep((_, memberId) => !winners.includes(memberId));

    if (giveaway.AddRoles.length)
        members.forEach((member) => member.roles.add(giveaway.AddRoles).catch(() => { }));

    giveaway.LauchDate = dateNow;
    giveaway.Actived = false;
    giveaway.WinnersGiveaway = winners;
    giveaway.setUnavailable();

    const giveawayMessageFields: APIEmbedField[] = [
        {
            name: `${e.Reference} Sorteio`,
            value: `${giveaway.MessageLink?.length ? `🔗 [Link do Sorteio](${giveaway.MessageLink})` : "Ok, a referência sumiu"}` + `\n🆔 *\`${giveaway.MessageID}\`*`,
            inline: true
        },
        {
            name: `${e.Star} Prêmio`,
            value: giveaway.Prize,
            inline: true
        }
    ];

    const sponsor = await giveaway.fetchSponsor();
    if (sponsor || giveaway.Sponsor)
        fields.unshift({
            name: `${e.ModShield} Patrocinador`,
            value: `${sponsor?.username || "Sponsor's username not found"}\n\`${giveaway.Sponsor}\``,
            inline: true
        });

    const toMention = Array.from(new Set(winners));
    if (toMention.length >= 10) return multiMentions();

    async function multiMentions() {

        const toMentionMapped = toMention.map(userId => `🎉 <@${userId}> \`${userId}\``);

        for (let i = 0; i < toMention.length; i += 10) {
            const content = toMentionMapped.slice(i, i + 10).join("\n");
            message.reply({ content });
            continue;
        }

        await sleep(1000);
        message.reply({
            content: giveaway.CreatedBy ? `${e.Notification} <@${giveaway.CreatedBy}>` : giveaway.Sponsor ? `<@${giveaway.Sponsor}>` : undefined,
            embeds: [{
                color: Colors.Green,
                title: `${e.Tada} Sorteio Finalizado`,
                url: giveaway.MessageLink,
                fields: giveawayMessageFields,
                footer: {
                    text: `${toMention.length}/${giveaway.Winners} participantes sorteados`
                }
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Dados deste sorteio",
                    emoji: e.Animated.SaphireReading.emoji(),
                    custom_id: JSON.stringify({ c: "giveaway", src: "list", gwId: giveaway.MessageID }),
                    style: ButtonStyle.Primary
                }]
            }]
        });

        if (giveaway.AddRoles.length)
            channel?.send({
                content: `${e.Animated.SaphireDance} | Os vencedores deste sorteio ganharam ${giveaway.AddRoles.length} cargo${giveaway.AddRoles.length === 1 ? "" : "s"}. Parabéns!`,
                embeds: [
                    {
                        color: Colors.Green,
                        description: giveaway.AddRoles.map(roleId => `<@&${roleId}>`).join(", ").limit("MessageEmbedDescription"),
                        footer: {
                            text: "Todos os cargos foram adicionados ao vencedores automaticamente.\nSe o cargo não foi adicionado, eu posso não ter as permissões necessárias."
                        }
                    }
                ]
            });

        return finish();
    }

    if (!winners?.length && giveaway.Participants.size)
        giveawayMessageFields.push({
            name: `${e.Gear} System`,
            value: "Nenhum dos participantes cumprem os requisitos do sorteio."
        });

    toMention.push(giveaway?.CreatedBy || giveaway.Sponsor);
    channel?.send({
        content: `${e.Notification} | ${Array.from(new Set(toMention)).filter(i => i).map(id => `<@${id}>`).join(", ")}`.limit("MessageContent"),
        embeds: [{
            color: Colors.Green,
            title: `${e.Tada} Sorteio Finalizado`,
            url: giveaway.MessageLink,
            fields: giveawayMessageFields,
            footer: {
                text: `${winners.length || 0}/${giveaway.Winners} participantes sorteados`
            }
        }],
        components: [{
            type: 1,
            components: [
                {
                    type: 2,
                    label: "Dados deste sorteio",
                    emoji: e.Animated.SaphireReading.emoji(),
                    custom_id: JSON.stringify({ c: "giveaway", src: "list", gwId: giveaway.MessageID }),
                    style: ButtonStyle.Primary
                }
            ]
        }]
    })
        .then(() => finish())
        .catch(() => giveaway.delete());

    if (giveaway.AddRoles.length)
        return channel?.send({
            content: `${e.Animated.SaphireDance} | Os vencedores deste sorteio ganharam ${giveaway.AddRoles.length} cargo${giveaway.AddRoles.length === 1 ? "" : "s"}. Parabéns!`,
            embeds: [
                {
                    color: Colors.Green,
                    description: giveaway.AddRoles.map(roleId => `<@&${roleId}>`).join(", ").limit("MessageEmbedDescription"),
                    footer: {
                        text: "Todos os cargos foram adicionados ao vencedores automaticamente.\nSe o cargo não foi adicionado, eu posso não ter as permissões necessárias."
                    }
                }
            ]
        }).catch(() => { });

    return;

    async function finish() {

        await Database.Guilds.updateOne(
            { id: giveaway.GuildId, "Giveaways.MessageID": giveaway.MessageID },
            {
                $set: {
                    "Giveaways.$.Participants": Array.from(giveaway.Participants),
                    "Giveaways.$.Actived": false,
                    "Giveaways.$.DischargeDate": dateNow,
                    "Giveaways.$.LauchDate": dateNow,
                    "Giveaways.$.WinnersGiveaway": Array.from(new Set(winners))
                }
            }
        );

        const components = message?.components[0]?.toJSON() as APIActionRowComponent<APIButtonComponent> | undefined;
        const body = { components: [].asMessageComponents(), embeds: [message?.embeds[0]] };

        if (components) {
            components.components[0].disabled = true;
            components.components[0].label = `Participar (${giveaway.Participants.size})`;
            body.components.push(components);
        }

        return message?.edit(body);
    }

}