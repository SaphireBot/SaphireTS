import { ButtonStyle, ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import { DiscordPermissons } from "../../../../util/constants";
import permissionsMissing from "../../../functions/permissionsMissing";
import { GiveawayManager } from "../../../../managers";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { GuildSchema } from "../../../../database/models/guild";
import { GiveawayType } from "../../../../@types/models";

export default async function (interaction: ChatInputCommandInteraction<"cached">, giveawayId: string | null) {

    const { member, userLocale: locale, guildLocale } = interaction;

    if (!member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

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

    const message = await giveaway.getMessage();

    if (!message)
        return await interaction.editReply({
            content: t("giveaway.options.reset.error_to_reset", { e, locale, err: "Giveaway's message not found" })
        });

    const embed = message.embeds?.[0]?.toJSON();
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

    const newGiveawayMessage = await giveaway.channel?.send({ embeds: [embed], components: message.components }).catch(() => undefined);

    if (newGiveawayMessage) {
        giveaway.MessageID = newGiveawayMessage.id;

        const dateNow = Date.now();
        const data = await Database.Guilds.findOneAndUpdate(
            { id: interaction.guild.id, "Giveaways.MessageID": message.id },
            {
                $set: {
                    "Giveaways.$.MessageID": giveaway.MessageID,
                    "Giveaways.$.DateNow": dateNow,
                    "Giveaways.$.Participants": [],
                    "Giveaways.$.Actived": true,
                    "Giveaways.$.WinnersGiveaway": []
                },
                $unset: {
                    "Giveaways.$.DischargeDate": true,
                    "Giveaways.$.LauchDate": true
                }
            },
            { new: true, upsert: true }
        ) as GuildSchema | Error;

        if (data instanceof Error)
            return await interaction.editReply({
                content: t("giveaway.options.reset.error_to_reset", { e, locale, err: data })
            });

        giveaway.delete();
        const gw = data.Giveaways.find(g => g.MessageID === newGiveawayMessage.id);
        GiveawayManager.set(gw as GiveawayType);

        return await interaction.editReply({
            content: t("giveaway.options.reset.success", { e, locale }),
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        label: t("giveaway.giveawayKeyword", locale),
                        url: giveaway.message.url,
                        style: ButtonStyle.Link,
                    }
                ]
            }]
        });
    }

    return await interaction.editReply({
        content: t("giveaway.options.reset.fail", { e, locale })
    });
}