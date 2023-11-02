import { ChatInputCommandInteraction, ButtonStyle, parseEmoji, ButtonInteraction, APIEmbed, Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import socket from "../../../services/api/ws";
import { urls } from "../../../util/constants";
import { getPaginationButtons } from "../../components/buttons/buttons.get";

export default async function list(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>
) {

    const { guildId, userLocale: locale } = interactionOrMessage;

    const msg = await interactionOrMessage.reply({
        content: t("twitch.loading", { e, locale }),
        fetchReply: true
    });

    let data = (await socket.twitch.getGuildData(guildId)).filter(d => d.streamer);

    if (!data?.length)
        return await msg.edit({
            content: null,
            embeds: [{
                color: 0x9C44FB,
                title: t("twitch.streamer_list", { e, locale }),
                image: { url: urls.not_found_image }
            }]
        });

    let embeds = EmbedGenerator();
    const components = getPaginationButtons();

    components[0].components.push({
        type: 2,
        label: t("twitch.refresh", locale),
        emoji: parseEmoji(e.Loading),
        custom_id: "refresh",
        style: ButtonStyle.Primary
    });

    await msg.edit({ content: null, embeds: [embeds[0]], components: embeds.length > 1 ? components : [] });

    if (embeds.length <= 1) return;

    let i = 0;
    return msg.createMessageComponentCollector({
        filter: int => int.user.id === ("author" in interactionOrMessage ? interactionOrMessage.author.id : interactionOrMessage.user.id),
        idle: 1000 * 60 * 2
    })
        .on("collect", async (interaction): Promise<any> => {
            const { customId } = interaction as ButtonInteraction<"cached">;

            if (customId === "zero") i = 0;
            if (customId === "left") i = i <= 0 ? embeds.length - 1 : i - 1;
            if (customId === "right") i = i >= embeds.length - 1 ? 0 : i + 1;
            if (customId === "last") i = embeds.length - 1;

            if (customId === "refresh") {
                await interaction.deferUpdate();
                await refresh();
                i = 0;
                return await interaction.editReply({ embeds: [embeds[i]] });
            }

            return await interaction.update({ embeds: [embeds[i]] });
        })
        .on("end", async (): Promise<any> => await msg.edit({ components: [] }));

    function EmbedGenerator(): APIEmbed[] {

        let amount = 15;
        let page = 1;
        const embeds = [];
        const length = data.length / 15 <= 1 ? 1 : parseInt(Number(data.length / 15).toFixed(0));

        for (let i = 0; i < data.length; i += 15) {

            const description = data.slice(i, amount)
                .map(d => `${d.notified ? "🟢" : "🔴"} [${d.streamer}](https://www.twitch.tv/${d.streamer}) ${d.notified ? ` ${t("twitch.is_live_on_twitch", locale)}` : ""}`)
                .join("\n")
                .limit("MessageEmbedDescription");

            const pageCount = length > 1 ? ` ${page}/${length}` : "";

            embeds.push({
                color: 0x9c44fb,
                title: t("twitch.streamer_list", { e, locale }) + pageCount,
                url: "https://twitch.tv",
                description,
                thumbnail: { url: urls.twitch_logo, },
                footer: {
                    text: t("twitch.list_footer", { locale, num: data.length })
                }
            });

            page++;
            amount += 15;

        }

        return embeds;
    }

    async function refresh() {
        data = await socket.twitch.getGuildData(guildId);
        embeds = EmbedGenerator();
    }

}