import { APIEmbed, ButtonInteraction, ButtonStyle, MessageFlags, StringSelectMenuInteraction } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import client from "../../../saphire";
import indication from "./indications.anime";

export default async function display(interaction: StringSelectMenuInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;
    const data = JSON.parse(interaction.values[0]) as { endpoint: string, uid: string };

    if (data.uid !== user.id)
        return await interaction.reply({
            content: t("reminder.you_cannot_click_here", { e, locale }),
            flags: [MessageFlags.Ephemeral],
        });

    await interaction.update({
        content: t("anime.indication.loading", { e, locale }),
        components: [],
    });

    console.log("nekos.best FETCH 1");
    const indications = await fetch(`https://nekos.best/api/v2/${data.endpoint}?amount=20`, { method: "GET" }) // 20 is the limit => "1 ≤ X ≤ 20"
        .then(res => res.json())
        .catch(() => null) as Record<
            "results",
            { anime_name: string, url: string }[]
            | {
                artist_href: string
                artist_name: string
                source_url: string
                url: string
            }[]
        > | null;

    if (!indications || !indications?.results?.length)
        return await interaction.editReply({
            content: t("anime.indication.no_data_response", { e, locale }),
        });

    const embeds: APIEmbed[] = [];

    for (let i = 0; i < indications.results.length; i++) {
        const indicaiton = indications.results[i];

        if ("artist_name" in indicaiton)
            embeds.push({
                color: 0xe91e55, // Color from nekos.best API
                title: `${t("anime.indication.embed_title", { locale, bot_name: client.user!.username })} - ${i + 1}/${indications.results.length}`,
                description: `🖌️ ${indicaiton.artist_name}\n${e.mag} ${t(`anime.indication.${data.endpoint}`, locale)}`,
                image: { url: indicaiton.url },
                footer: {
                    text: "💗 Powered By: nekos.best API",
                },
            });

        if ("anime_name" in indicaiton)
            embeds.push({
                color: 0xe91e55, // Color from nekos.best API
                title: `${t("anime.indication.embed_title", { locale, bot_name: client.user!.username })} - ${i + 1}/${indications.results.length}`,
                description: `📺 ${indicaiton.anime_name}\n${e.mag} ${t(`anime.indication.${data.endpoint}`, locale)}`,
                image: { url: indicaiton.url },
                footer: {
                    text: "💗 Powered By: nekos.best API",
                },
            });
    }

    const msg = await interaction.editReply({
        content: null,
        embeds: [embeds[0]],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: "⏪",
                        custom_id: "zero",
                        style: ButtonStyle.Primary,
                        disabled: embeds.length === 1,
                    },
                    {
                        type: 2,
                        emoji: "◀️",
                        custom_id: "preview",
                        style: ButtonStyle.Primary,
                        disabled: embeds.length === 1,
                    },
                    {
                        type: 2,
                        emoji: "▶️",
                        custom_id: "next",
                        style: ButtonStyle.Primary,
                        disabled: embeds.length === 1,
                    },
                    {
                        type: 2,
                        emoji: "⏩",
                        custom_id: "last",
                        style: ButtonStyle.Primary,
                        disabled: embeds.length === 1,
                    },
                ],
            },
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: e.mag.emoji(),
                        ...(() => {
                            const obj = {};

                            if ("source_url" in indications.results[0]) {
                                // @ts-expect-error ignroe
                                obj.url = indications.results[0]?.source_url;
                                // @ts-expect-error ignroe
                                obj.style = ButtonStyle.Link;
                            }

                            if ("anime_name" in indications.results[0]) {
                                // @ts-expect-error ignroe
                                obj.custom_id = JSON.stringify({ c: "s_anime", anime: indications.results[0]?.anime_name?.limit("CustomId") });
                                // @ts-expect-error ignroe
                                obj.style = ButtonStyle.Secondary;
                            }

                            return obj;
                        })(),
                    },
                    {
                        type: 2,
                        emoji: "🔄", // Refresh Emoji Buggued LOL
                        custom_id: "refresh",
                        style: ButtonStyle.Primary,
                    },
                    {
                        type: 2,
                        emoji: e.Trash,
                        custom_id: "cancel",
                        style: ButtonStyle.Primary,
                    },
                ],
            },
        ].asMessageComponents(),
    });

    let index = 0;
    const collector = msg.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        idle: 1000 * 120,
    })
        .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {
            const { customId, message } = int;
            if (customId.includes("s_anime")) return;

            if (customId === "zero") index = 0;
            if (customId === "preview") index = index <= 0 ? embeds.length - 1 : index - 1;
            if (customId === "next") index = index >= embeds.length - 1 ? 0 : index + 1;
            if (customId === "last") index = embeds.length - 1;
            if (customId === "cancel") return await message.delete().catch(() => { });
            if (customId === "refresh") {
                collector.stop("ignore");
                return await indication(int);
            }

            const [row1, row2] = [message.components[0].toJSON(), message.components[1].toJSON()];

            if ("source_url" in indications.results[index]) {
                // @ts-expect-error ignroe
                row2.components[0].url = indications.results[index]?.source_url;
                // @ts-expect-error ignroe
                row2.components[0].style = ButtonStyle.Link;
                // @ts-expect-error ignroe
                delete row2.components[0].custom_id;
            }

            if ("anime_name" in indications.results[index]) {
                // @ts-expect-error ignroe
                row2.components[0].custom_id = JSON.stringify({ c: "s_anime", anime: indications.results[index]?.anime_name?.limit("CustomId") });
                // @ts-expect-error ignroe
                row2.components[0].style = ButtonStyle.Secondary;
            }

            return await int.update({ embeds: [embeds[index]], components: [row1, row2] });
        })
        .on("end", async (_, reason: string): Promise<any> => {
            if (reason === "ignore") return;
            return await msg.edit({ components: [] }).catch(() => { });
        });
    return;
}