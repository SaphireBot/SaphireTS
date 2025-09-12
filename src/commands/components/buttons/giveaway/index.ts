import { ButtonInteraction, MessageFlags } from "discord.js";
import { GiveawayManager } from "../../../../managers";
import { e } from "../../../../util/json";
import join from "./join";
import leave from "./leave";
import { urls } from "../../../../util/constants";
import { t } from "../../../../translator";
import deleteGiveaway from "./delete";
import finish from "../../../slash/moderation/giveaway/finish";
import reset from "../../../slash/moderation/giveaway/reset";
import reroll from "../../../slash/moderation/giveaway/rerrol";
import info from "../../../slash/moderation/giveaway/info";

export default async function giveawayButton(interaction: ButtonInteraction<"cached">, customData: { c: "giveaway", src: string | undefined, gwId?: string }) {

    const locale = interaction.userLocale;

    if (customData?.src === "ignore")
        return await interaction.update({ content: t("giveaway.nothing_happen", { e, locale }), components: [] });

    const giveaway = GiveawayManager.cache.get(customData?.gwId || interaction.message?.id);

    if (!customData?.src)
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: "$81SD98H7SER3@#",
        });

    if (customData?.src === "join") return await join(interaction);
    if (!giveaway)
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("giveaway.not_found", { e, locale }),
        });

    if (!giveaway.message)
        giveaway.message = interaction.message;

    switch (customData?.src) {
        case "leave": leave(interaction, giveaway); break;
        case "delete": deleteGiveaway(interaction, customData?.gwId); break;
        case "finish": finish(interaction, customData.gwId); break;
        case "reset": reset(interaction, customData.gwId); break;
        case "reroll": reroll(interaction, customData.gwId); break;
        case "info": info(interaction, customData.gwId); break;

        case "list":
            await interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: `${e.Animated.SaphireReading} | ${t("giveaway.link", locale)}: ${urls.saphireSiteUrl}/giveaway/${giveaway?.MessageID}`,
            });
            break;

        default:
            await interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: `${e.DenyX} | #4SD78JYTU4RCH87D8#`,
            });
            break;
    }

    return;
}