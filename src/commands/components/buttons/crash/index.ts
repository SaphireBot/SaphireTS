import { ButtonInteraction } from "discord.js";
import { CrashManager } from "../../../../managers";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import join from "./join";

export default async function crashBet(interaction: ButtonInteraction<"cached">, data: { src: "join" | "take" }) {

    const { message, userLocale: locale } = interaction;
    const crash = CrashManager.cache.get(message.id);

    if (!crash)
        return await interaction.update({
            content: t("crash.game_not_found", { e, locale }),
            components: [], embeds: []
        });

    if (data.src === "join") return await join(interaction, crash);
    if (data.src === "take") return await crash.take(interaction);
    return;
}