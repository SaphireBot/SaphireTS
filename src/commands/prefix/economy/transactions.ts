import { Message, parseEmoji, ButtonStyle, ComponentType, StringSelectMenuInteraction, APIEmbed, Colors } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { TransactionsType } from "../../../@types/commands";
import Database from "../../../database";
import { urls } from "../../../util/constants";
const aliases = ["ts", "transaction", "transação", "transações", "取引", "transacciones", "transaktionen", "tr"];

export default {
    name: "transactions",
    description: "Check out the transactions",
    aliases,
    category: "economy",
    api_data: {
        category: "Economia",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: async function (message: Message) {

        if (message.partial) await message.fetch().catch(() => { });

        let { userLocale: locale } = message;

        if (message.partial) await message.fetch().catch(() => { });
        const user = (await message.parseUserMentions())?.first() || message.author;

        const msg = await message.reply({ content: t("transactions.loading", { e, locale, user }) });

        let transactions = (await Database.getUser(user.id))?.Transactions as TransactionsType[];

        if (!transactions?.length)
            return await msg.edit({
                content: t("transactions.not_found", { e, locale, user }),
            });

        let embeds = EmbedGenerator(transactions);

        const buttons = {
            type: 1,
            components: [
                {
                    type: 2,
                    emoji: parseEmoji("⏪"),
                    custom_id: "zero",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    emoji: parseEmoji("◀️"),
                    custom_id: "left",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    emoji: parseEmoji("▶️"),
                    custom_id: "right",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    emoji: parseEmoji("⏩"),
                    custom_id: "last",
                    style: ButtonStyle.Primary,
                },
            ],
        };

        const components = embeds.length > 1
            ? [buttons, getSelectMenu()]
            : [getSelectMenu()];

        await msg.edit({ content: null, embeds: [embeds[0]], components });

        let index = 0;
        const collector = msg.createMessageComponentCollector({
            filter: int => int.user.id === message.author.id,
            idle: 1000 * 60 * 15,
        })
            .on("collect", async (int): Promise<any> => {
                locale = await int.user.locale() || "en-US";
                const customId = int.componentType === ComponentType.StringSelect ? int.values[0] : int.customId;
                if (customId === "cancel") return collector.stop();

                if (customId === "zero") index = 0;
                if (customId === "last") index = embeds.length - 1;
                if (customId === "right") index = index === embeds.length - 1 ? 0 : index + 1;
                if (customId === "left") index = index <= 0 ? embeds.length - 1 : index - 1;

                if (["zero", "last", "right", "left"].includes(customId))
                    return await int.update({
                        content: null,
                        embeds: [embeds[index]],
                        components: embeds.length > 1 ? [getSelectMenu(), buttons] : [getSelectMenu()],
                    });

                if (customId === "all") {
                    index = 0;
                    embeds = EmbedGenerator(transactions);
                }

                if (customId === "refresh") return await refresh(int as StringSelectMenuInteraction<"cached">);

                if (
                    int.componentType === ComponentType.StringSelect
                    && customId !== "all"
                ) {
                    index = 0;
                    embeds = EmbedGenerator(transactions.filter(data => [data.type, data.mode].includes(customId as any)));
                }

                if (!embeds.length)
                    return await nothingHere(int as StringSelectMenuInteraction<"cached">);

                return await int.update({
                    content: null,
                    embeds: [embeds[index]],
                    components: embeds.length > 1 ? [getSelectMenu(), buttons] : [getSelectMenu()],
                });
            })
            .on("end", async (): Promise<any> => await msg.edit({ components: [] }).catch(() => { }));

        return;

        function EmbedGenerator(array: TransactionsType[]) {

            const embeds: APIEmbed[] = [];
            const length = array.length / 10 <= 1 ? 1 : (array.length / 10);
            let amount = 10;
            let page = 1;

            for (let i = 0; i < array.length; i += 10) {

                const current = array.slice(i, amount);
                const description = current?.map(data => {
                    data.value = Number(data.value || 0).currency() as any;
                    return `${Date.toDiscordCompleteTime(new Date(data.createdAt))} ${t(data.keywordTranslate, { locale, data, userIdentify: data?.userIdentify })}`;
                }).join("\n");
                const pageCount = length > 1 ? ` ${page}/${length.toFixed(0)}` : "";

                embeds.push({
                    color: Colors.Blue,
                    title: t("transactions.embed.title", { e, locale, user }) + pageCount,
                    url: urls.saphireSiteUrl + `/transactions/${user.id}`,
                    description: description || "??",
                    footer: {
                        text: t("transactions.embed.footer", { value: array.length, locale }),
                    },
                });

                page++;
                amount += 10;
            }

            return embeds;
        }

        async function refresh(int: StringSelectMenuInteraction<"cached">) {

            await int.update({
                content: t("transactions.refreshing", { e, locale, user }),
                embeds: [], components: [],
            });

            transactions = (await Database.getUser(user.id))?.Transactions as TransactionsType[];
            embeds = EmbedGenerator(transactions);
            index = 0;
            return await msg.edit({
                content: null,
                embeds: [embeds[0]],
                components: embeds.length > 1 ? [getSelectMenu(), buttons] : [getSelectMenu()],
            });
        }

        async function nothingHere(int: StringSelectMenuInteraction<"cached">) {
            return await int.update({
                content: null,
                embeds: [{
                    color: Colors.Red,
                    title: t("transactions.embed.title", { e, locale, user }),
                    image: { url: urls.not_found_image },
                }],
                components: [getSelectMenu()],
            });
        }

        function getSelectMenu() {
            return {
                type: 1,
                components: [{
                    type: 3,
                    custom_id: "menu",
                    placeholder: "Opções de transações",
                    options: [
                        {
                            label: t("transactions.components.label.gain", locale),
                            emoji: e.gain || "💸",
                            description: t("transactions.components.description.gain", locale),
                            value: "gain",
                        },
                        {
                            label: t("transactions.components.label.loss", locale),
                            emoji: e.loss || "📈",
                            description: t("transactions.components.description.loss", locale),
                            value: "loss",
                        },
                        {
                            label: t("transactions.components.label.admin", locale),
                            emoji: e.Admin || "⚙️",
                            description: t("transactions.components.description.admin", locale),
                            value: "admin",
                        },
                        {
                            label: t("transactions.components.label.system", locale),
                            emoji: parseEmoji("⚙️"),
                            description: t("transactions.components.description.system", locale),
                            value: "system",
                        },
                        ...["pay", "crash", "jokempo", "daily", "vote", "race", "bitcoin", "glass", "blackjack", "pig"]
                            .map(str => ({
                                label: t(`transactions.components.label.${str}`, locale),
                                emoji: parseEmoji(emojiFormat(str)),
                                description: t(`transactions.components.description.${str}`, locale),
                                value: str,
                            })),
                        {
                            label: t("transactions.components.label.all", locale),
                            emoji: parseEmoji("⏮"),
                            description: t("transactions.components.description.all", locale),
                            value: "all",
                        },
                        {
                            label: t("transactions.components.label.refresh", locale),
                            emoji: e.Animated.SaphireReading,
                            description: t("transactions.components.description.refresh", locale),
                            value: "refresh",
                        },
                        {
                            label: t("transactions.components.label.cancel", locale),
                            emoji: parseEmoji("❌"),
                            description: t("transactions.components.description.cancel", locale),
                            value: "cancel",
                        },
                    ],
                }],
            };
        }

        function emojiFormat(value: string) {
            return {
                pay: e.safira,
                jokempo: ["🤚", "👊", "✌️"].random(),
                daily: "📅",
                vote: e.topgg,
                race: "🏁",
                bitcoin: e.BitCoin,
                glass: e.glassAlive,
                blackjack: e.cards[0].emoji,
                pig: e.Pig,
            }[value] || "🔹";
        }
    },
};