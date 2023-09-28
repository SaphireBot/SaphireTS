import { Colors, APIEmbed, APIEmbedField, time, APIActionRowComponent, APIButtonComponent, GuildMember, Collection, ButtonStyle } from "discord.js";
import Giveaway from "../../../../structures/giveaway/giveaway";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { t } from "../../../../translator";

export default async function lauchGiveaway(giveaway: Giveaway) {

    const messageEmbed = giveaway.message.embeds[0];
    const fields: APIEmbedField[] = messageEmbed?.fields || [];
    const guild = giveaway.guild;
    const message = giveaway.message;
    const channel = giveaway.channel;
    const locale = guild?.preferredLocale;
    if (!guild) return;

    const dateNow = Date.now();
    const embed: APIEmbed & { fields: APIEmbedField[] } = {
        color: Colors.Red,
        title: `${e.Tada} ${t("giveaway.giveawayKeyword", locale)} ${guild.name} | ${t("giveaway.closed", locale)}`,
        fields: [
            {
                name: `${e.Trash} ${t("giveaway.exclusion", locale)}`,
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
        components.components[0].label = t("giveaway.join", { locale, participants: giveaway.Participants.size });
        components.components[1].disabled = giveaway.Participants.size === 0;
        await message.edit({ embeds: [embed], components: [components] });
    }

    if (!giveaway.Participants.size) {
        embed.fields.push({
            name: `${e.Info} ${t("giveaway.canceled", locale)}`,
            value: t("giveaway.nobody_join", locale),
            inline: true
        });

        giveaway.channel?.send({
            embeds: [{
                color: Colors.Red,
                title: `${e.DenyX} ` + t("giveaway.canceled", locale),
                description: t("giveaway.participants_missing", {
                    e,
                    locale,
                    link: giveaway.MessageLink?.length ? `[${t("giveaway.link", locale)}](${giveaway.MessageLink})` : t("giveaway.lost_reference", locale)
                })
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
            name: `${e.Reference} ${t("giveaway.giveawayKeyword", locale)}`,
            value: t("giveaway.link_reference", {
                locale,
                link: giveaway.MessageLink?.length ? `🔗 [${t("giveaway.link", locale)}](${giveaway.MessageLink})` : t("giveaway.lost_reference", locale) + `\n🆔 *\`${giveaway.MessageID}\`*`
            }),
            inline: true
        },
        {
            name: t("giveaway.prize", { e, locale }),
            value: giveaway.Prize,
            inline: true
        }
    ];

    const sponsor = await giveaway.fetchSponsor();
    if (sponsor || giveaway.Sponsor)
        fields.unshift({
            name: t("giveaway.sponsoredBy", { e, locale }),
            value: `${sponsor?.username || "Sponsor's username not found"}\n\`${giveaway.Sponsor}\``,
            inline: true
        });

    const toMention = Array.from(new Set(winners));
    const toMentionMapped = toMention.map(userId => `🎉 <@${userId}> \`${userId}\``);
    const contents: string[] = [];

    for (let i = 0; i < toMention.length; i += 5)
        contents.push(toMentionMapped.slice(i, i + 5).join("\n"));

    let errors = 0;
    for await (const content of contents)
        await message.reply(content).catch(() => errors++);

    if (errors > 0)
        message.channel.send({ content: `${e.bug} | Error to send ${errors} messages in this channel` });

    await message.reply({
        content: giveaway.CreatedBy ? `${e.Notification} <@${giveaway.CreatedBy}>` : giveaway.Sponsor ? `<@${giveaway.Sponsor}>` : undefined,
        embeds: [{
            color: Colors.Green,
            title: `${e.Tada} ${t("giveaway.finished", locale)}`,
            url: giveaway.MessageLink,
            fields: giveawayMessageFields,
            footer: {
                text: `${toMention.length}/${giveaway.Winners} ${t("giveaway.drawn_participants", locale)}`
            }
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: t("giveaway.data_and_participants", locale),
                emoji: e.Animated.SaphireReading.emoji(),
                custom_id: JSON.stringify({ c: "giveaway", src: "list", gwId: giveaway.MessageID }),
                style: ButtonStyle.Primary
            }]
        }]
    });

    if (giveaway.AddRoles.length)
        await channel?.send({
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

    const componentsData = message?.components[0]?.toJSON() as APIActionRowComponent<APIButtonComponent> | undefined;
    const body = { components: [].asMessageComponents(), embeds: [message?.embeds[0]] };

    if (componentsData) {
        componentsData.components[0].disabled = true;
        componentsData.components[0].label = t("giveaway.join", {
            e,
            locale,
            participants: giveaway.Participants.size
        });
        body.components.push(componentsData);
    }

    return await message?.edit(body)
        .catch(err => {
            // Unkown Message
            if (err?.code === 10008) return;
            return err;
        });

}