import { ButtonInteraction } from "discord.js";
import { GiveawayManager } from "../../../../managers";
import { e } from "../../../../util/json";
import join from "./join";
import leave from "./leave";
import { urls } from "../../../../util/constants";

export default async function giveawayButton(interaction: ButtonInteraction<"cached">, customData: { c: "giveaway", src: "join" | "list" | "leave" | "ignore", gwId?: string }) {

    const giveaway = GiveawayManager.cache.get(customData?.gwId || interaction.message?.id);

    if (customData?.src === "ignore")
        return await interaction.update({
            content: `${e.Animated.SaphireReading} | Vamos fingir que nada aconteceu.`,
            components: []
        });

    if (customData?.src === "list")
        return await interaction.reply({
            content: `${e.Animated.SaphireReading} | link do sorteio: ${urls.saphireSiteUrl}/giveaway/?id=${giveaway?.MessageID}&guildId=${interaction.guildId}`,
            ephemeral: true
        });

    if (!giveaway)
        return await interaction.reply({
            content: `${e.DenyX} | Sorteio não encontrado.`,
            ephemeral: true
        });

    if (customData?.src === "join") return join(interaction, giveaway);
    if (customData?.src === "leave") return leave(interaction, giveaway);

    return await interaction.reply({
        content: `${e.DenyX} | Recurso do botão não definido.`,
        ephemeral: true
    });
}