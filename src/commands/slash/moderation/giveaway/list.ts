import { ChatInputCommandInteraction, APIEmbed, Colors, ButtonStyle, Message } from "discord.js";
import { GiveawayManager } from "../../../../managers";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function list(interaction: ChatInputCommandInteraction<"cached"> | Message<true>) {

    const { userLocale: locale, guildId } = interaction;

    const giveaways = GiveawayManager.getGiveawaysFromAGuild(guildId)
        || await GiveawayManager.fetchGiveawaysFromAGuild(guildId);

    if (!giveaways?.length)
        return await interaction.reply({ content: t("giveaway.no_giveaway_found", { e, locale }) });

    let messageToEdit: Message<boolean> | undefined | null;

    if (interaction instanceof ChatInputCommandInteraction)
        messageToEdit = await interaction.reply({
            content: t("giveaway.loading_giveaways", { e, locale }),
            withResponse: true,
        }).then(res => res.resource?.message);

    if (interaction instanceof Message)
        messageToEdit = await interaction.reply({ content: t("giveaway.loading_giveaways", { e, locale }) });

    const actived = t("giveaway.actived", locale);
    const drawned = t("giveaway.drawned", locale);
    const GwMapped = giveaways.map(gw => `[${gw.Actived ? actived : drawned}] [${format30(gw.Prize)}](${gw.MessageLink})`);
    const embeds = EmbedGenerator(GwMapped);

    if (!embeds.length)
        return await messageToEdit?.edit({
            content: t("giveaway.error_to_generate_embed", locale),
        });

    if (embeds.length <= 1)
        return await messageToEdit?.edit({ content: null, embeds: [embeds[0]] });

    const msg = await messageToEdit?.edit({
        content: null,
        embeds: [embeds[0]],
        components: [{
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("giveaway.components.left", locale),
                    custom_id: "left",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    label: t("giveaway.components.right", locale),
                    custom_id: "right",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    label: t("giveaway.components.cancel", locale),
                    custom_id: "cancel",
                    style: ButtonStyle.Danger,
                },
            ],
        }],
    });

    let index = 0;

    const collector: any = msg?.createMessageComponentCollector({
        filter: int => int.user.id === interaction.member?.id,
        idle: 60000,
    })
        .on("collect", async int => {

            const { customId } = int;

            if (customId === "cancel") return collector.stop();

            if (customId === "right") {
                index++;
                if (!embeds[index]) index = 0;
            }

            if (customId === "left") {
                index--;
                if (!embeds[index]) index = embeds.length - 1;
            }

            await int.update({ embeds: [embeds[index]] }).catch(() => { });
            return;
        })
        .on("end", async () => {
            embeds[index].color = Colors.Red;
            await msg.edit({
                embeds: [embeds[index]],
                components: [],
            }).catch(() => { });
            return;
        });

    function EmbedGenerator(array: string[]): APIEmbed[] {

        const embeds: APIEmbed[] = [];
        let amount = 10;
        let page = 1;
        const length = array.length / 10 <= 1 ? 1 : Math.floor((array.length / 10) + 1);
        const footer_text = t("giveaway.list_footer_text", { e, locale, giveaways: giveaways.length });

        for (let i = 0; i < array.length; i += 10) {

            embeds.push({
                color: Colors.Blue,
                title: t("giveaway.list_title", {
                    e,
                    locale,
                    pageCount: length > 1 ? ` ${page}/${length}` : "",
                }),
                description: array.slice(i, amount).join("\n"),
                footer: { text: footer_text },
            });

            page++;
            amount += 10;
        }

        return embeds;
    }

    function format30(string: string) {

        if (string.length > 30)
            return `${string.slice(0, 27)}...`;

        return string;
    }
}