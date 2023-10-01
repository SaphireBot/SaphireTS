import { APIUser, Message, User } from "discord.js";
import socket from "../../../services/api/ws";
import { e } from "../../../util/json";
import { t } from "../../../translator";
const aliases = ["b", "bal", "saldo", "solde", "kontostand", "残高", "safira", "safiras", "sapphire", "sapphires", "zafiro", "saphir", "サファイア"];

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
        const msg = await message.reply({ content: t("balance.loading", { e, locale }) });
        const users = await message.getMultipleUsers() as (User | APIUser)[];
        let ids: string[] = [];

        if (!users?.length && !args?.length) {
            const data = await socket.getBalance(author.id);
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
        else ids = users.map(u => u?.id);

        if (ids?.length > 60)
            ids = ids.slice(0, 60);

        if (!ids.length)
            return await msg.edit({
                content: t("balance.no_data_found", { e, locale })
            });

        const data = await socket.getMultipleBalance(ids);
        if (!data?.length)
            return await msg.edit({
                content: t("balance.no_data_found_with_ids", {
                    e,
                    locale,
                    ids
                })
            });

        const contents: string[] = [];
        for (let i = 0; i < 60; i += 20) {
            contents.push(
                data
                    .slice(i, i + 20)
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