import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { allGifsAvailable, endpoints } from "./gifs";

export default async function all(target: ChatInputCommandInteraction<"cached"> | Message<true>) {

    const { userLocale } = target;
    const author = target instanceof ChatInputCommandInteraction ? target.user : target.author;
    let embeds: APIEmbed[] = [];
    let index = 0;
    build();

    const components = [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    emoji: "◀️",
                    custom_id: "preview",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    emoji: "▶️",
                    custom_id: "next",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    emoji: "🔄",
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
    ].asMessageComponents();

    let msg: Message<boolean> | undefined | null;

    if (target instanceof ChatInputCommandInteraction)
        msg = await target.reply({
            embeds: [embeds[0]], components, withResponse: true,
        }).then(res => res.resource?.message);

    if (target instanceof Message)
        msg = await target.reply({ embeds: [embeds[0]], components });

    const collector = msg?.createMessageComponentCollector({
        filter: int => int.user.id === author.id,
        idle: (1000 * 60) * 2,
    })
        .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

            const { customId } = int;

            if (customId === "cancel") return collector?.stop();

            if (customId === "preview") {
                index--;
                if (index < 0) index = embeds.length - 1;
            }

            if (customId === "next") {
                index++;
                if (index > embeds.length - 1) index = 0;
            }

            if (customId === "refresh") build();

            return await int.update({ embeds: [embeds[index]] }).catch(() => { });
        })
        .on("end", async (): Promise<any> => msg?.delete().catch(() => { }));

    return;

    function build() {

        index = 0;
        embeds = [];
        const gifs = Array.from(endpoints).map(endpoint => ([endpoint, allGifsAvailable.get(endpoint) || []])); // Array.from(allGifsAvailable.entries());
        const total = gifs.reduce((prev, curr) => prev += curr?.[1]?.length, 0);
        let page = 1;
        const length = gifs.length / 20 <= 1 ? 1 : parseInt(((gifs.length / 20) + 1).toFixed(0)) - 1;

        for (let i = 0; i < gifs.length; i += 20) {
            embeds.push({
                color: Colors.Blue,
                title: `${t("interactions.all_interactions", { e, locale: userLocale })} - ${page}/${length}`,
                description: gifs
                    .slice(i, i + 20)
                    .map(([endpoint, gifs]) => `\`${endpoint} (${gifs?.length || 0})\` - ${t(`anime.indication.${endpoint}`, { locale: userLocale })}`)
                    .join("\n")
                    .limit("EmbedDescription")
                    || t("serverinfo.refresh.loading", { e, locale: userLocale }),
                footer: {
                    text: `❤️ ${total.currency()} Gifs Powered by Nekos Best & Tenor`,
                },
            });

            page++;
        }

        return;
    }
}