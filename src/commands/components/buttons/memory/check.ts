import { ButtonInteraction } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import sequency from "../../../functions/memory/sequency/sequency";
import solo from "../../../functions/memory/solo/solo";
import click from "../../../functions/memory/click";
import { ChannelsInGame } from "../../../../util/constants";

export default async function memoryCheck(
    interaction: ButtonInteraction<"cached">,
    data: {
        c: "memory",
        src: "solo" | "cooperative" | "versus" | "sequency" | any,
        uid: string,
        id?: string
    }
) {

    const { user, channelId, userLocale: locale } = interaction;

    if (data?.src?.id) return await click(interaction, data?.src as any);

    if (ChannelsInGame.has(channelId))
        return await interaction.update({
            content: t("memory.this_channel_is_in_game", { e, locale }),
            components: []
        });

    if (user.id !== data?.uid)
        return await interaction.reply({
            content: t("memory.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    if (data?.src === "sequency") return await sequency(interaction, 0);
    if (data?.src === "solo") return await solo(interaction);

    return await interaction.update({
        content: "Method under building... #51565#" + ` ${data.src} mode`,
        components: []
    });
}