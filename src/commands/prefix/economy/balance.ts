import { APIUser, Message, User } from "discord.js";
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
            bot: []
        }
    },
    execute: async function (message: Message, args: string[]) {

        const { userLocale: locale, author } = message;

        if (!args?.length) {
            const data = await Database.getBalance(author.id);
            return await message.reply({
                content: t(
                    data.position > 0
                        ? "balance.render_own"
                        : "balance.render_own_without_ranking",
                    {
                        e,
                        balance: data.balance.currency(),
                        position: data.position.currency(),
                        locale
                    }
                )
            });
        }

        const msg = await message.reply({ content: t("balance.loading", { e, locale }) });
        const users = await message.getMultipleUsers() as (User | APIUser)[];
        let ids: string[] = [];

        if (!users?.length && !args?.length) {
            const data = await Database.getBalance(author.id);
            return await msg.edit({
                content: t(
                    data.position > 0
                        ? "balance.render_own"
                        : "balance.render_own_without_ranking",
                    {
                        e,
                        balance: data.balance.currency(),
                        position: data.position.currency(),
                        locale
                    }
                )
            });
        }
        else ids = Array.from(new Set(users.map(u => u?.id)));

        if (ids?.length > 60)
            ids = ids.slice(0, 60);

        if (!ids.length)
            return await msg.edit({
                content: t("balance.no_data_found", { e, locale })
            });

        const data = (await Database.getMultipleBalance(ids)).sort((a, b) => b.balance - a.balance);
        if (!data?.length)
            return await msg.edit({
                content: t("balance.no_data_found_with_ids", {
                    e,
                    locale,
                    ids
                })
            });

        const contents: string[] = [];
        for (let i = 0; i < 60; i += 15) {
            contents.push(
                data
                    .filter(d => ids.some(id => id === d.id))
                    .slice(i, i + 15)
                    .map(data => t(data.position > 0
                        ? "balance.multiple_render_with_ranking"
                        : "balance.multiple_render_without_ranking", {
                        e,
                        locale,
                        balance: data.balance?.currency(),
                        position: data.position?.currency(),
                        user: users.find(u => u.id === data.id)
                    })
                    )
                    .join("\n")
                    .limit("MessageContent")
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
    }
};