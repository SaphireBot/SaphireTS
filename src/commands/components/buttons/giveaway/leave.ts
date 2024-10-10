import Giveaway from "../../../../structures/giveaway/giveaway";
import { ButtonInteraction } from "discord.js";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import refreshButton from "./refreshButton";
import { t } from "../../../../translator";

export default async function join(interaction: ButtonInteraction<"cached">, giveaway: Giveaway) {

    const { user, userLocale: locale } = interaction;

    await interaction.update({
        content: t("giveaway.removing_you", { e, locale }),
        components: [],
    });

    if (giveaway.lauched)
        return await interaction.editReply({
            content: t("giveaway.giveaway_ended_up_cannot_remove", { e, locale }),
            components: [],
        });

    if (!giveaway.Participants.has(user.id))
        return await interaction.editReply({
            content: t("giveaway.wait_you_are_not_in", { e, locale }),
            components: [],
        });

    giveaway.Participants.delete(user.id);
    return Database.Guilds.findOneAndUpdate(
        { id: interaction.guild.id, "Giveaways.MessageID": giveaway.MessageID },
        { $pull: { "Giveaways.$.Participants": interaction.user.id } },
        { new: true },
    )
        .then(async document => {
            giveaway.removeParticipant(interaction.user.id);
            const giveawayObject = document?.Giveaways?.find(gw => gw?.MessageID === giveaway.MessageID);

            if (!giveawayObject) {
                giveaway.delete();
                return await interaction.editReply({
                    content: t("giveaway.not_found_in_database", { e, locale }),
                    components: [],
                });
            }

            refreshButton(giveaway.MessageID);
            return await interaction.editReply({
                content: t("giveaway.removed", { e, locale }),
                components: [],
            });
        })
        .catch(async err => await interaction.editReply({
            content: t("giveaway.error_to_remove", { e, locale, err }),
        }));
}