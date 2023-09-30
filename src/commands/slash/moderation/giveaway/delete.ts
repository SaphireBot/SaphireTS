import { ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { GiveawayManager } from "../../../../managers";

export default async function deleteGiveaway(interaction: ChatInputCommandInteraction | Message<true>, giveawayId?: string | null) {

    const { userLocale: locale } = interaction;

    if (!giveawayId)
        return await interaction.reply({
            content: t("giveaway.options.delete.id_source_not_found", { e, locale })
        });

    const giveaway = GiveawayManager.cache.get(giveawayId);

    if (!giveaway)
        return await interaction.reply({
            content: t("giveaway.not_found", { e, locale })
        });

    return await interaction.reply({
        content: t("giveaway.options.ask_to_delete", {
            e,
            locale,
            gwId: giveaway.MessageID,
            participants: giveaway.Participants.size
        }),
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: t("giveaway.components.confirm", locale),
                        custom_id: JSON.stringify({ c: "giveaway", src: "delete", gwId: giveawayId }),
                        style: ButtonStyle.Danger
                    },
                    {
                        type: 2,
                        label: t("giveaway.components.cancel", locale),
                        custom_id: JSON.stringify({ c: "delete" }),
                        style: ButtonStyle.Success
                    },
                    {
                        type: 2,
                        label: t("giveaway.giveawayKeyword", locale),
                        url: `https://discord.com/channels/${giveaway.GuildId}/${giveaway.ChannelId}/${giveaway.MessageID}`,
                        style: ButtonStyle.Link
                    }
                ]
            }
        ],
        fetchReply: true
    });
}