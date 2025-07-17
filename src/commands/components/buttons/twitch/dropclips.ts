import { ButtonInteraction, parseEmoji } from "discord.js";
import socket from "../../../../services/api/ws";
import { t } from "../../../../translator";

export default async function dropclips(interaction: ButtonInteraction<"cached">, commandData: { c: "twitch", src: "clips", streamerId: string }) {

    await interaction.deferUpdate();

    const clips = await socket.twitch?.getClips(commandData.streamerId);

    if (!clips || "message" in clips || !clips?.length) return await interaction.editReply({ content: interaction.message.content });

    const selectMenu = {
        type: 1,
        components: [{
            type: 3,
            custom_id: JSON.stringify({ c: "twitch", src: "clips" }),
            placeholder: t("twitch.get_some_clips", {
                interaction,
                clips,
                locale: interaction.guild.preferredLocale,
                broadcaster_name: clips[0].broadcaster_name,
            }).limit("SelectMenuPlaceholder"),
            options: [].asMessageComponents(),
        }],
    };

    for (const clip of clips)
        selectMenu.components[0].options.push({
            label: `${clip.title}`.limit("SelectMenuOptionLabel"),
            emoji: parseEmoji("🎬"),
            description: t("twitch.get_some_clips_description", { locale: interaction.guild.preferredLocale, clip }),
            value: clip.url.split("/").pop(),
        });

    return await interaction.editReply({ components: [selectMenu] });
}