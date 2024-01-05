import translate from "@iamtraction/google-translate";
import display from "./display.anime";
import { StringSelectMenuInteraction } from "discord.js";
import { e } from "../../../util/json.js";
import { t } from "../../../translator/index.js";
import { KitsuAnimeData } from "../../../@types/commands.js";

export default async function translateAnime(interaction: StringSelectMenuInteraction) {

    const { userLocale: locale, values } = interaction;

    await interaction.update({
        content: t("anime.loading_and_translate", { e, locale }),
        embeds: [], components: []
    }).catch(() => { });

    const result = await fetch(
        `https://kitsu.io/api/edge/manga/${values[0] || ""}`,
        {
            headers: {
                Accept: "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json"
            }
        }
    )
        .then(res => res.json())
        .catch(err => err) as KitsuAnimeData | Error;

    if (result instanceof Error)
        return await interaction.editReply({ content: t("anime.search.error", { e, locale, err: result }) });

    const anime = result?.data?.attributes || null;

    if (!anime)
        return await interaction.editReply({
            content: t("anime.not_found", { e, locale })
        }).catch(() => { });

    const rawSynopsis = `${anime.synopsis.replace(/<[^>]*>/g, "").split("\n")[0]}`;

    const to = {
        "pt-BR": "pt",
        "en-US": "en",
        "en-ES": "es",
        "fr": "fr",
        "ja": "ja",
        "zh-CH": "zh"
    }[locale as string] || "en";

    const synopsis = (
        await translate(rawSynopsis, { to })
    ).text || rawSynopsis || "No Description";

    return await display(result, synopsis, interaction);
}
