import { ButtonInteraction } from "discord.js";
import { GiveawayManager } from "../../../../managers";
import { e } from "../../../../util/json";
import join from "./join";
import leave from "./leave";
import { urls } from "../../../../util/constants";
import { t } from "../../../../translator";

export default async function giveawayButton(interaction: ButtonInteraction<"cached">, customData: { c: "giveaway", src: "join" | "list" | "leave" | "ignore", gwId?: string }) {

    const locale = interaction.userLocale;
    const giveaway = GiveawayManager.cache.get(customData?.gwId || interaction.message?.id);

    if (customData?.src === "ignore")
        return await interaction.update({
            content: t("giveaway.nothing_happen", { e, locale }),
            components: []
        });

    if (customData?.src === "list")
        return await interaction.reply({
            content: `${e.Animated.SaphireReading} | ${t("giveaway.link", locale)}: ${urls.saphireSiteUrl}/giveaway/?id=${giveaway?.MessageID}&guildId=${interaction.guildId}`,
            ephemeral: true
        });

    if (!giveaway)
        return await interaction.reply({
            content: t("giveaway.not_found", { e, locale }),
            ephemeral: true
        });

    if (customData?.src === "join") return join(interaction, giveaway);
    if (customData?.src === "leave") return leave(interaction, giveaway);

    return await interaction.reply({
        content: `${e.DenyX} | #4SD78JYTU4RCH87D8#`,
        ephemeral: true
    });
}