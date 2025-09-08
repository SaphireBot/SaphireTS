import { ButtonInteraction, ButtonStyle, Colors, MessageFlags, StringSelectMenuInteraction, codeBlock } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import start from "./first";
import last from "./last";

export default async function history(
    interaction: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached">,
    data: { c: "history", pg: "first" | "last" | string, k: string, uid: string },
) {

    const { user, userLocale: locale } = interaction;
    if (data?.uid !== user.id)
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("history.you_cannot_click_here", { e, locale }),
        });

    if (data.pg === "first")
        return await start(interaction as ButtonInteraction<"cached">, data as any);

    if (data.pg === "last")
        return await last(interaction as ButtonInteraction<"cached">, data as any);

    if (`${t(`${data.k}.${data.pg}`)}` === data.pg)
        return await interaction.update({
            content: t("history.content_not_found", { e, locale }),
            components: [],
            embeds: [],
        });

    const lastPageNumber = Object.keys(t(data.k, locale)).length - 1;

    return await interaction.update({
        embeds: [
            {
                color: Colors.Blue,
                title: `${e.Animated.SaphireReading} ${t(`${data.k}.title`, locale)}`,
                description: codeBlock("TXT", `${t(`${data.k}.${data.pg}`, locale)}`.split("|").join("\n   ").replace(/\s+-/g, "\n-")),
            },
        ],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: "⏮️",
                        custom_id: JSON.stringify({ c: "history", pg: "first", k: data.k, uid: user.id }),
                        style: ButtonStyle.Primary,
                        disabled: data.pg === "1",
                    },
                    {
                        type: 2,
                        emoji: "◀️",
                        custom_id: JSON.stringify({ c: "history", pg: `${Number(data.pg) - 1}`, k: data.k, uid: user.id }),
                        style: ButtonStyle.Primary,
                        disabled: data.pg === "1",
                    },
                    {
                        type: 2,
                        label: `${data.pg}/${lastPageNumber}`,
                        custom_id: "page",
                        style: ButtonStyle.Secondary,
                        disabled: true,
                    },
                    {
                        type: 2,
                        emoji: "▶️",
                        custom_id: JSON.stringify({ c: "history", pg: `${Number(data.pg) + 1}`, k: data.k, uid: user.id }),
                        style: ButtonStyle.Primary,
                        disabled: `${lastPageNumber}` === data.pg,
                    },
                    {
                        type: 2,
                        emoji: "⏭️",
                        custom_id: JSON.stringify({ c: "history", pg: "last", k: data.k, uid: user.id }),
                        style: ButtonStyle.Primary,
                        disabled: `${lastPageNumber}` === data.pg,
                    },
                ],
            },
        ].asMessageComponents(),
    });
}