import { Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
const aliases = ["b", "bal", "saldo", "solde", "kontostand", "残高", "safira", "safiras", "sapphire", "sapphires", "zafiro", "saphir", "サファイア", "atm"];

export default {
    name: "balance",
    description: "Check out the Safiras",
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
    execute: async function (message: Message<true>, args: string[]) {

        const { userLocale: locale, author } = message;

        if (!args?.length) {
            const data = await Database.getBalanceWithPosition(author.id);
            return await message.reply({
                content: t(
                    data.position > 0
                        ? "balance.render_own"
                        : "balance.render_own_without_ranking",
                    {
                        e,
                        balance: data.balance.currency(),
                        position: data.position.currency(),
                        locale,
                    },
                ),
            });
        }

        const msg = await message.reply({ content: t("balance.loading", { e, locale }) });

        if (message.partial) await message.fetch().catch(() => { });
        const users = await message.parseUserMentions();
        const ids = Array.from(new Set(users.keys()));

        if (!users?.size && !args?.length) {
            const data = await Database.getBalanceWithPosition(author.id);
            return await msg.edit({
                content: t(
                    data.position > 0
                        ? "balance.render_own"
                        : "balance.render_own_without_ranking",
                    {
                        e,
                        balance: data.balance.currency(),
                        position: data.position.currency(),
                        locale,
                    },
                ),
            });
        }

        if (!ids.length)
            return await msg.edit({
                content: t("balance.no_data_found", { e, locale }),
            });

        if (ids.length > 60)
            ids.length = 60;

        const data = await Database.getBalanceWithPosition(ids);
        if (!data?.size)
            return await msg.edit({
                content: t("balance.no_data_found_with_ids", {
                    e,
                    locale,
                    ids,
                }),
            })
                .catch(() => { });

        const contents: string[] = [];
        for (let i = 0; i < 60; i += 15) {
            contents.push(
                data
                    .filter((_, userId) => ids.some(id => id === userId))
                    .map((data, userId) => t(data.position > 0
                        ? "balance.multiple_render_with_ranking"
                        : "balance.multiple_render_without_ranking", {
                        e,
                        locale,
                        balance: data.balance?.currency(),
                        position: data.position?.currency(),
                        user: users.get(userId),
                    }),
                    )
                    .slice(i, i + 15)
                    .join("\n")
                    .limit("MessageContent"),
            );
        }

        let i = 0;
        for await (const content of contents.filter(Boolean)) {
            await send(i, content);
            i++;
            continue;
        }

        async function send(i: number, content: string) {
            return i === 0
                ? await msg.edit({ content })
                : await message.channel.send({ content });
        }
    },
};