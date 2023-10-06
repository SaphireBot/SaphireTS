import { APIEmbed, ButtonStyle, ChatInputCommandInteraction, Colors, ComponentType, Message, parseEmoji } from "discord.js";
import { PayManager } from "../../../../managers";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { PaySchema } from "../../../../database/models/pay";

export default async function listPay(message: Message<true> | ChatInputCommandInteraction<"cached">) {

    const author = message instanceof Message ? message.author : message.user;
    let locale = await author.locale() || "en-US";
    const msg = await message.reply({ content: t("pay.list.loading", { e, locale }), fetchReply: true });

    const userPays = await PayManager.getAllFromUserId(author.id);
    const isPayer = userPays.filter(data => data.payer === author.id);
    const isReceiver = userPays.filter(data => data.receiver === author.id);

    if (!isPayer.length && !isReceiver.length)
        return await msg.edit({
            content: t("pay.list.nothing_here", { e, locale })
        });

    const payerEmbeds = EmbedGenerator(isPayer);
    const receiverEmbeds = EmbedGenerator(isReceiver);

    if (!payerEmbeds.length && !receiverEmbeds.length)
        return await msg.edit({ content: t("pay.list.no_embeds_genereted", { e, locale }) });

    let embeds = payerEmbeds.length ? payerEmbeds : receiverEmbeds;

    await msg.edit({
        content: null,
        embeds: [embeds[0]],
        components: getComponents(locale, embeds.length)
    });

    let index = 0;
    const collector = msg.createMessageComponentCollector({
        filter: int => int.user.id === author.id,
        idle: 1000 * 60 * 5
    })
        .on("collect", async (interaction): Promise<any> => {
            locale = await interaction.user?.locale() || "en-US";

            const value = interaction.isButton()
                ? interaction.customId
                : interaction.values?.[0];

            switch (value) {
                case "delete": return collector.stop("delete");
                case "zero": index = 0; break;
                case "left": index = index <= 0 ? embeds.length - 1 : index - 1; break;
                case "right": index = index >= embeds.length - 1 ? 0 : index + 1; break;
                case "last": index = embeds.length - 1; break;

                case "sended":
                    embeds = payerEmbeds;
                    index = 0;
                    break;

                case "recieved":
                    embeds = receiverEmbeds;
                    index = 0;
                    break;

                default:
                    break;
            }

            return await interaction.update({
                content: null,
                embeds: [embeds[index]],
                components: getComponents(locale, embeds.length)
            });
        })
        .on("end", async (_, reason): Promise<any> => {

            if (reason === "delete") return await msg.delete();

            const embed = embeds[index];
            embed.color = Colors.Red;

            return await msg.edit({
                content: null,
                embeds: [embed],
                components: []
            });
        });

    return;

    function EmbedGenerator(array: PaySchema[]) {

        if (!array?.length)
            return [{
                color: Colors.Blue,
                title: t("pay.list.embed.title", { e, locale }) + " 1/1",
                image: {
                    url: "https://i.pinimg.com/originals/36/72/34/36723405ae6788b18a972c68ce414b04.gif"
                }
            }];

        let amount = 10;
        let page = 1;
        const embeds: APIEmbed[] = [];
        const length = array.length / 10 <= 1 ? 1 : (array.length / 10) + 1;

        for (let i = 0; i < array.length; i += 10) {

            const current = array.slice(i, amount);
            const description = current.map(data => `[[${t("pay.list.embed.message", locale)}](https://discord.com/channels/${data.guildId}/${data.channelId}/${data.messageId})] ${t("pay.list.embed.value", { locale, v: data.value?.currency() })}`).join("\n");

            embeds.push({
                color: Colors.Blue,
                title: t("pay.list.embed.title", { e, locale }) + ` ${page}/${length.toFixed(0)}`,
                description,
                fields: [ // Max: 25
                    {
                        name: t("pay.list.embed.status", { e, locale }),
                        value: `${t("pay.list.select_menu.options.0.label", locale)}: ${t("pay.list.embed.value", { locale, v: isPayer.reduce((pre, curr) => pre += (curr?.value || 0), 0).currency() })}`
                            + "\n"
                            + `${t("pay.list.select_menu.options.1.label", locale)}: ${t("pay.list.embed.value", { locale, v: isReceiver.reduce((pre, curr) => pre += (curr?.value || 0), 0).currency() })}`,
                        inline: true
                    }
                ]
            });

            page++;
            amount += 10;

        }

        return embeds;
    }

    function getComponents(locale: string, embedsLength: number) {
        const components = [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.StringSelect,
                        custom_id: "menu",
                        placeholder: t("pay.list.select_menu.placeholder", { e, locale, pays: isPayer.length + isReceiver.length }),
                        options: [
                            {
                                label: t("pay.list.select_menu.options.0.label", locale),
                                emoji: e.Leave,
                                description: t("pay.list.select_menu.options.0.description", { locale, total: isPayer.reduce((pre, curr) => pre += (curr?.value || 0), 0).currency() }),
                                value: "sended"
                            },
                            {
                                label: t("pay.list.select_menu.options.1.label", locale),
                                emoji: e.Join,
                                description: t("pay.list.select_menu.options.1.description", { locale, total: isReceiver.reduce((pre, curr) => pre += (curr?.value || 0), 0).currency() }),
                                value: "recieved"
                            },
                            {
                                label: t("pay.list.select_menu.options.2.label", locale),
                                emoji: e.DenyX,
                                description: t("pay.list.select_menu.options.2.description", locale),
                                value: "delete"
                            }
                        ]
                    }
                ]
            }
        ].asMessageComponents();

        if (embedsLength > 1)
            components.unshift(
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            emoji: parseEmoji("⏪"),
                            custom_id: "zero",
                            style: ButtonStyle.Primary,
                            disabled: embedsLength <= 1
                        },
                        {
                            type: 2,
                            emoji: parseEmoji("◀️"),
                            custom_id: "left",
                            style: ButtonStyle.Primary,
                            disabled: embedsLength <= 1
                        },
                        {
                            type: 2,
                            emoji: parseEmoji("▶️"),
                            custom_id: "right",
                            style: ButtonStyle.Primary,
                            disabled: embedsLength <= 1
                        },
                        {
                            type: 2,
                            emoji: parseEmoji("⏩"),
                            custom_id: "last",
                            style: ButtonStyle.Primary,
                            disabled: embedsLength <= 1
                        },
                    ]
                }
            );

        return components;

    }
}