import { ButtonInteraction } from "discord.js";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import refreshButton from "./refreshButton";
import { t } from "../../../../translator";
import Giveaway from "../../../../structures/giveaway/giveaway";

export default async function leave(interaction: ButtonInteraction<"cached">, giveaway: Giveaway) {

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

    return await Database.Giveaways.findOneAndUpdate(
        { MessageID: giveaway.MessageID },
        { $pull: { Participants: user.id } },
        { upsert: true, new: true },
    )
        .then(async giveawayObject => {
            giveaway.removeParticipant(user.id);

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