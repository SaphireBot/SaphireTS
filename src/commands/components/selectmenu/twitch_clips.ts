import { StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import socket from "../../../services/api/ws";

export default async function clips(interaction: StringSelectMenuInteraction<"cached">) {

    const { userLocale: locale, values } = interaction;

    await interaction.reply({ content: t("twitch.loading", { e, locale }), ephemeral: true });

    const clip = (await socket.twitch?.getClip(values[0]))?.[0];

    if (
        !clip
        || "message" in clip
    )
        return await interaction.editReply({
            content: t("twitch.nothing_found", { e, locale }),
        });

    return await interaction.editReply({
        content: t("twitch.clip_message_content", {
            e, clip, locale,
            view_count: (clip.view_count || 0)?.currency(),
        }),
    });
}