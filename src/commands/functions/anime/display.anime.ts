import { ButtonStyle, Colors, StringSelectMenuInteraction, time } from "discord.js";
import { KitsuAnimeData } from "../../../@types/commands.js";
import { t } from "../../../translator/index.js";
import { e } from "../../../util/json.js";

export default async function display(
    rawData: KitsuAnimeData,
    synopsis: string,
    interaction: StringSelectMenuInteraction
) {

    const { userLocale: locale } = interaction;
    const anime = rawData.data.attributes;

    const Subtype = {
        ONA: t("anime.subtype.ONA", locale),
        OVA: t("anime.subtype.OVA", locale),
        TV: t("anime.subtype.TV", locale),
        movie: t("anime.subtype.movie", locale),
        music: t("anime.subtype.music", locale),
        special: t("anime.subtype.special", locale),
        doujin: t("anime.subtype.doujin", locale),
        manga: t("anime.subtype.manga", locale),
        manhua: t("anime.subtype.manhua", locale),
        manhwa: t("anime.subtype.manhwa", locale),
        novel: t("anime.subtype.novel", locale),
        oel: t("anime.subtype.oel", locale),
        oneshot: t("anime.subtype.oneshot", locale)
    }[anime.showType] || rawData.data.type === "manga" ? "manga" : "anime";

    const synopse = synopsis?.limit("MessageEmbedDescription") || "`Synopsis Not Found`";

    const Status = {
        current: t("anime.status.current", locale),
        finished: t("anime.status.finished", locale),
        tba: t("anime.status.tba", locale),
        unreleased: t("anime.status.unreleased", locale),
        upcoming: t("anime.status.upcoming", locale)
    }[anime.status as "current"] || "Status undefined";

    const Name = {
        en: anime.titles.en || e.DenyX,
        en_jp: anime.titles.en_jp || e.DenyX,
        original: anime.titles.ja_jp || e.DenyX,
        canonical: anime.canonicalTitle || e.DenyX,
        abreviated: (anime.abbreviatedTitles || []).join(", ")
    };

    const IdadeRating = {
        G: t("anime.search.age.free", locale), // "Livre",
        PG: t("anime.search.age.parents", locale), // "+10 - Orientação dos Pais Sugerida",
        R: t("anime.search.age.16", locale), // "+16 Anos",
        R18: t("anime.search.age.18", locale), // "+18 Anos"
    }[anime.ageRating] || "Age group undefined";

    const NSFW = anime.nsfw ? e.CheckV : e.DenyX;
    const Nota = anime.averageRating || "??";
    const AnimeRanking = anime.ratingRank || "0";
    const AnimePop = anime.popularityRank || "0";
    const Epsodios = anime.episodeCount || "N/A";

    const Create = anime.createdAt
        ? time(new Date(anime.createdAt), "f")
        : t("anime.no_lauched", locale);

    const LastUpdate = anime.updatedAt
        ? time(new Date(anime.updatedAt), "f")
        : t("anime.no_updated", locale);

    const Lancamento = anime.startDate ? `${new Date(anime.startDate).toLocaleDateString("pt-br")}` : t("anime.lauching", locale);
    const Termino = anime.endDate
        ? new Date(anime.endDate).toLocaleDateString("pt-br")
        : anime.startDate ? t("anime.live", locale) : t("anime.out_live", locale);

    const components = [];
    
    if (anime.youtubeVideoId)
        components.push({
            type: 1,
            components: [
                {
                    type: 2,
                    label: "YouTube",
                    emoji: e.youtube,
                    url: `https://www.youtube.com/watch?v=${anime.youtubeVideoId}`,
                    style: ButtonStyle.Link
                }
            ]
        } as any);

    return await interaction.editReply({
        content: null,
        embeds: [{
            color: Colors.Green,
            title: t("anime.search.embed_title", locale),
            description: t("anime.search.embed.description", { locale, synopse }).limit("MessageEmbedDescription"),
            fields: [
                {
                    name: t("anime.search.embed.fields.0.name", locale),
                    value: t("anime.search.embed.fields.0.value", {
                        locale,
                        Name,
                        IdadeRating,
                        NSFW,
                        Subtype,
                        episodeLength: anime.episodeLength ? t("anime.search.episodeLength", { locale, episodeLength: anime.episodeLength }) : ""
                    })
                },
                {
                    name: t("anime.search.embed.fields.1.name", { locale, Status }),
                    value: t("anime.search.embed.fields.1.value", {
                        locale,
                        Nota,
                        AnimeRanking,
                        AnimePop,
                        Epsodios,
                        Create,
                        LastUpdate,
                        Lancamento,
                        Termino
                    })
                }
            ],
            image: { url: anime.posterImage?.original ? anime.posterImage.original : "" },
            footer: { text: "❤  Powered By Kitsu API" }
        }],
        components
    })
        .catch(async err => {
            return await interaction.editReply({
                content: `${e.Warn} | Ocorreu um erro no comando "anime"\n> \`${err}\``,
                components: []
            });
        });
}