import { ButtonInteraction, ButtonStyle, Colors, codeBlock } from "discord.js";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function lasy(interaction: ButtonInteraction<"cached">, data: { c: "history", pg: "last", k: string, uid: string }) {

    const { user, userLocale: locale } = interaction;
    const lastPageNumber = Object.keys(t(data.k, locale)).length - 1;

    return await interaction.update({
        embeds: [
            {
                color: Colors.Blue,
                title: `${e.Animated.SaphireReading} ${t(`${data.k}.title`, locale)}`,
                description: codeBlock("TXT", `${t(`${data.k}.${lastPageNumber}`, locale)}`.split("|").join("\n   ").replace(/\s+-/g, "\n-"))
            }
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
                        disabled: `${lastPageNumber}` === "1"
                    },
                    {
                        type: 2,
                        emoji: "◀️",
                        custom_id: JSON.stringify({ c: "history", pg: `${lastPageNumber - 1}`, k: data.k, uid: user.id }),
                        style: ButtonStyle.Primary,
                        disabled: `${lastPageNumber}` === "1"
                    },
                    {
                        type: 2,
                        label: `${lastPageNumber}/${lastPageNumber}`,
                        custom_id: "page",
                        style: ButtonStyle.Secondary,
                        disabled: true
                    },
                    {
                        type: 2,
                        emoji: "▶️",
                        custom_id: "0",
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        type: 2,
                        emoji: "⏭️",
                        custom_id: "1",
                        style: ButtonStyle.Primary,
                        disabled: true
                    }
                ]
            }
        ].asMessageComponents()
    });

}