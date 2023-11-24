import { ChatInputCommandInteraction, APIEmbedField, ButtonStyle, PermissionsBitField, ButtonInteraction, Colors, Message } from "discord.js";
import permissionsMissing from "../../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../../util/constants";
import { e } from "../../../../util/json";
import { GiveawayManager } from "../../../../managers";
import { t } from "../../../../translator";

export default async function rerrol(
    interaction: ChatInputCommandInteraction<"cached">
        | ButtonInteraction<"cached">
        | Message<true>,
    giveawayId?: string,
    winners?: number
) {

    const { member, userLocale: locale } = interaction;

    if (!member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    let messageId: string | undefined = giveawayId;

    if (giveawayId) messageId = giveawayId;
    else if ("options" in interaction) {
        messageId = interaction.options.getString("giveaway") || "";
        winners = interaction.options.getInteger("winners") || 0;
    }

    if (!messageId)
        return await reply(t("giveaway.reroll.no_giveaway_id_found", { e, locale }));

    const giveaway = GiveawayManager.cache.get(messageId);

    if (!giveaway)
        return await reply(t("giveaway.reroll.any_giveaway_found", { e, locale }));

    if (giveaway.Actived)
        return await reply(t("giveaway.reroll.still_active", { e, locale }));

    if (!giveaway.Participants.size)
        return await reply(t("giveaway.reroll.giveaway_without_participants", { e, locale }));

    if (!winners || isNaN(winners))
        winners = giveaway.Winners;

    if (winners > giveaway.Participants.size)
        winners = giveaway.Participants.size;

    const msg = await reply(t("giveaway.reroll.iniciating", { e, locale }), [], [], true);

    let toMention: string | string[] = Array.from(giveaway.Participants)
        .filter(id => !giveaway.WinnersGiveaway.includes(id))
        .random(winners);

    if (typeof toMention === "string")
        toMention = [toMention];

    if (!toMention?.length)
        return await msg.edit({
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
                    label: t("giveaway.reroll.components.original", interaction.guild?.preferredLocale),
                    emoji: "🔗",
                    url: giveaway.MessageLink,
                    style: ButtonStyle.Link
                },
                {
                    type: 2,
                    label: t("giveaway.reroll.components.participants", { locale: interaction.guild?.preferredLocale, participants: giveaway.Participants.size }),
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

    return await msg.edit({ content: t("giveaway.reroll.complete", { e, locale }) });

    async function reply(content: string, components: any[] = [], embeds: any[] = [], returnMessage: boolean = false) {
        if (!(interaction instanceof Message)) {
            return interaction.isChatInputCommand()
                ? interaction.replied
                    ? await interaction.editReply({ content, components, embeds })
                    : await interaction.reply({ content, components, embeds, fetchReply: returnMessage })
                : await interaction.update({ content, components, embeds, fetchReply: returnMessage });
        } else return await interaction.reply({ content, components, embeds });
    }
}