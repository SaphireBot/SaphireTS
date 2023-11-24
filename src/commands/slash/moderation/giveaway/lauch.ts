import { Colors, APIEmbed, APIEmbedField, time, APIActionRowComponent, APIButtonComponent, GuildMember, Collection, AttachmentBuilder } from "discord.js";
import Giveaway from "../../../../structures/giveaway/giveaway";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { t } from "../../../../translator";
import client from "../../../../saphire";

export default async function lauch(giveaway: Giveaway) {

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

    const members = await guild.members.fetch()
        .catch(() => new Collection<string, GuildMember>()) || new Collection<string, GuildMember>();
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
                    const array: string[] = new Array((joins || 0)).fill(memberId);
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

    if (toMention.length === 1)
        await message.reply({
            content: t("giveaway.notify", {
                e,
                locale: giveaway.guild.preferredLocale || "en-US",
                userId: toMention?.[0],
                giveaway
            })
        });
    else await notifyMultipleMembers();

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

    const creator = await client.users.fetch(giveaway.CreatedBy).catch(() => null);
    if (creator) {
        await client.users.send(
            creator.id,
            { content: t("reminder.giveaway_finish", { e, locale: await creator.locale(), url: giveaway.MessageLink, prize: giveaway.Prize }) }
        ).catch(() => { });
    }
    return await message?.edit(body)
        .catch(err => {
            // Unkown Message
            if (err?.code === 10008) return;
            return err;
        });

    async function notifyMultipleMembers() {

        if (toMention.length > 30)
            return await sendTxtFile();

        for (let i = 0; i < toMention.length; i += 10)
            contents.push(toMentionMapped.slice(i, i + 10).join("\n"));

        let errors = 0;
        await message.reply({
            content: t("giveaway.less_then_or_equal_30_winners", {
                e,
                locale: giveaway.guild?.preferredLocale,
                toMention,
                giveaway
            })
        });

        for await (const content of contents)
            await message.channel.send(content.limit("MessageContent")).catch(() => errors++);

        if (errors > 0)
            message.channel.send({ content: `${e.bug} | Error to send ${errors} messages in this channel` });

        return;
    }

    async function sendTxtFile() {

        const length = `${toMention.length}`.length;
        const participants = toMention
            .map((userId, i) => {
                const member = members.get(userId);
                if (!member) return `${format(i + 1, length)}. ${userId}`;
                return `${format(i + 1, length)}. ${member.user?.username ? `${member.user?.username} ` : ""}${userId}`;
            })
            .join("\n");

        const attachment = new AttachmentBuilder(
            Buffer.from(
                t("giveaway.winners_from", { locale: giveaway.guild?.preferredLocale, giveaway, participants }),
                "utf-8"
            ),
            {
                name: `${giveaway.MessageID}.txt`,
                description: "Giveaways Winners"
            }
        );

        return await message.channel.send({
            content: t("giveaway.too_much_members_a_file_is_needed", {
                e,
                locale: giveaway.guild?.preferredLocale,
                toMention
            }),
            files: [attachment]
        });
    }

    function format(num: number, length: number): string {
        let zero = "";

        for (let i = 0; i < (length - `${num}`.length); i++)
            zero += "0";

        return `${zero}${num}`;
    }
}