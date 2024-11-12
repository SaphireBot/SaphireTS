import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function indications(interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;

    if (interaction instanceof ButtonInteraction)
        await interaction.update({
            content: t("anime.indication.loading_indications", { e, locale }),
            embeds: [], components: [],
        });
    else await interaction.reply({ content: t("anime.indication.loading_indications", { e, locale }) });

    const endpoints = await fetch("https://nekos.best/api/v2/endpoints", { method: "GET" })
        .then(res => res.json())
        .catch(() => null) as Record<string, Record<string, "png" | "gif">> | null;

    if (!endpoints)
        return await interaction.editReply({
            content: t("anime.indication.no_answer", { e, locale }),
        });

    if (typeof endpoints !== "object")
        return await interaction.editReply({
            content: t("anime.indication.unknown_response", { e, locale }),
        });

    const components = getSelectMenus();

    return await interaction.editReply({
        content: t("anime.indication.indications_getted", { e, locale }),
        components: components.slice(0, 5),
    });

    function getSelectMenus() {

        const selects = [] as any[];
        const types = Object.entries(endpoints!).map(([key, { format }]) => ({
            label: `${format.toUpperCase()} | ${t(`anime.indication.${key}`, locale)}`,
            value: JSON.stringify({ endpoint: key, uid: user.id }),
        }));

        for (let i = 0; i < types.length; i += 25)
            selects.push({
                type: 1,
                components: [{
                    type: 3,
                    custom_id: JSON.stringify({ c: "anime", src: "ind", i }),
                    placeholder: t("anime.indication.select_your_type", locale),
                    options: types.slice(i, i + 25),
                }],
            });

        return selects;
    }
}