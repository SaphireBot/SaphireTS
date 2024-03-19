import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, ModalSubmitInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { KitsuApiEdgeAnime, KitsuApiEdgeManga, KitsuApiEdgeResult } from "../../../@types/commands";
import { urls } from "../../../util/constants";

export default async function searchAnime(
    interaction: ChatInputCommandInteraction<"cached"> | ModalSubmitInteraction<"cached"> | ButtonInteraction<"cached">,
    ephemeral: boolean
) {

    const { userLocale: locale } = interaction;

    if (interaction instanceof ModalSubmitInteraction)
        await interaction.message!.delete().catch(() => { });

    await interaction.reply({
        content: t("anime.search.loading", { e, locale }),
        ephemeral
    });

    const input = (() => {

        if (interaction instanceof ChatInputCommandInteraction)
            return interaction.options.getString("input") || "";

        if (interaction instanceof ModalSubmitInteraction)
            return interaction.fields.getTextInputValue("input") || "";

        if (interaction instanceof ButtonInteraction)
            return JSON.parse(interaction.customId)?.anime || "";
            
        return "";
    })();

    const animeOrManga = (() => {

        if (interaction instanceof ChatInputCommandInteraction)
            return interaction.options.getString("anime_or_manga") || "anime";

        if (interaction instanceof ModalSubmitInteraction)
            return interaction.fields.getTextInputValue("anime_or_manga") || "anime";

        return "anime";
    })();

    const result = await fetch(
        `https://kitsu.io/api/edge/${animeOrManga}?filter[text]=${encodeURI(input)}`,
        {
            headers: {
                Accept: "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json"
            }
        }
    )
        .then(res => res.json())
        .catch(err => err) as KitsuApiEdgeResult | Error;

    if (result instanceof Error || !result?.data || !result?.links || !result?.meta)
        return await interaction.editReply({ content: t("anime.search.error", { e, locale, err: result }).limit("MessageContent") });

    if (typeof result?.links?.next === "string") {
        const nextUrl = await next(result?.links?.next);
        if (nextUrl) await next(nextUrl);
    }

    result.data = result.data.slice(0, 25);

    if (!result.data?.length)
        return await interaction.editReply({
            content: null,
            embeds: [{
                color: Colors.Blue,
                title: t("anime.search.embed_title", locale),
                image: { url: urls.not_found_image }
            }],
            components: []
        });

    const selectMenu = selectMenuGenerator(result.data);

    return await interaction.editReply({
        content: t("anime.search.choose_an_result", {
            e,
            locale,
            results: result.data?.length || 0,
        }),
        embeds: [{
            color: Colors.Blue,
            title: t("anime.search.embed_title", locale),
            description: result.data.map(anime => {
                const name = ["zh-CN", "ja"].includes(locale)
                    ? anime.attributes.titles.ja_jp || anime.attributes.canonicalTitle || anime.attributes.abbreviatedTitles?.[0] || anime.attributes.titles.en_jp || e.DenyX
                    : anime.attributes.canonicalTitle || anime.attributes.abbreviatedTitles?.[0] || anime.attributes.titles.en_jp || anime.attributes.titles.ja_jp || e.DenyX;
                if ("youtubeVideoId" in anime.attributes)
                    return `[${name}](https://www.youtube.com/watch?v=${anime.attributes.youtubeVideoId})`;
                return name;
            })
                .join("\n")
                .limit("EmbedDescription")
        }],
        components: [
            selectMenu.components?.length > 0 ? selectMenu : false,
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: t("keyword_cancel", locale),
                        custom_id: JSON.stringify({ c: "delete" }),
                        style: ButtonStyle.Danger,
                        disabled: ephemeral
                    }
                ]
            }
        ].filter(Boolean).asMessageComponents()
    });

    function selectMenuGenerator(animes: KitsuApiEdgeAnime[] | KitsuApiEdgeManga[]) {

        const selectMenuObject = {
            type: 1,
            components: [{
                type: 3,
                custom_id: JSON.stringify({ c: animeOrManga === "anime" ? "animeChoosen" : "mangaChoosen" }),
                placeholder: t("anime.search.select_menu_placeholder", locale),
                options: []
            }]
        };

        const values = [] as string[];

        for (const anime of animes) {
            if (!anime?.attributes) continue;

            const age = {
                G: 1,
                PG: 10,
                R: 16,
                R18: 18
            }[anime.attributes.ageRating] || 20;

            anime.attributes.age = age;
            continue;
        }

        animes = animes.sort((a, b) => a.attributes.age - b.attributes.age);

        for (const { attributes: anime, id } of animes) {
            if (!anime) continue;

            if (values.includes(id)) continue;
            values.push(id);

            const animeName = anime?.titles?.en || anime?.titles?.en_jp || anime?.canonicalTitle;
            if (!animeName || values.includes(animeName)) continue;

            const IdadeRating = {
                G: t("anime.search.age.free", locale), // "Livre",
                PG: t("anime.search.age.parents", locale), // "+10 - Orientação dos Pais Sugerida",
                R: t("anime.search.age.16", locale), // "+16 Anos",
                R18: t("anime.search.age.18", locale), // "+18 Anos"
            }[anime.ageRating] || t("anime.search.age.without", locale); // "Sem faixa etária";

            const emoji = {
                G: e.livre,
                PG: e["+10"],
                R: e["+16"],
                R18: "🔞"
            }[anime.ageRating] || e.QuestionMark;

            selectMenuObject.components[0].options.push({
                emoji,
                label: animeName.slice(0, 25) || `${Math.random()}`.slice(0, 25),
                description: IdadeRating.limit("SelectMenuOptionDescription"),
                value: id.slice(0, 25) || `${Math.random()}`.slice(0, 25)
            } as never);

            values.push(animeName);
            continue;
        }

        if (selectMenuObject.components[0].options.length > 25)
            selectMenuObject.components[0].options.length = 25;

        return selectMenuObject;
    }

    async function next(url: string) {
        const next = await fetch(url)
            .then(res => res.json())
            .catch(() => null) as KitsuApiEdgeResult | null;

        if (!next) return;

        if (Array.isArray(next?.data))
            (result as KitsuApiEdgeResult).data.push(...next.data as any);

        return next?.links?.next;
    }

}