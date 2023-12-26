import { Message } from "discord.js";
import { e } from "../../../util/json";
import Database from "../../../database";
import { User } from "discord.js";

export default async function adminBalance(message: Message<true>, args: string[] | undefined, msg: Message) {

    const value = Number(args?.[2]?.toNumber() || "0");
    if (value <= 0)
        return await msg.edit({
            content: `${e.DenyX} | O valor definido é igual ou menor que zero.`
        });

    const usersQuery = args?.slice(3) || [];
    let users: (User | null | undefined)[] = [];

    for await (const query of usersQuery) {
        const data = await message.getUser(query);
        if (data?.id) users.push(await message.getUser(query));
    }

    users = users.filter(Boolean);

    if (!users?.length)
        return await msg.edit({
            content: `${e.DenyX} | Nenhum usuário foi encontrado.`
        });

    if (["adicionar", "add", "hinzufügen", "添加", "追加", "ajouter", "añadir"].includes(args?.[1]?.toLowerCase() || ""))
        return await add();

    if (["rm", "sub", "remover", "remove", "entfernen", "移除", "削除", "supprimer", "eliminar"].includes(args?.[1]?.toLowerCase() || ""))
        return await remove();

    if (["set", "config", "configurar", "configure", "konfigurieren", "配置", "設定", "configurer", "configurar"].includes(args?.[1]?.toLowerCase() || ""))
        return await set();

    return await msg.edit({
        content: `${e.DenyX} | Métodos válidos: \`add\`, \`sub\`, \`set\``
    });

    async function add() {

        for await (const user of users)
            if (user?.id)
                await Database.editBalance(
                    user.id,
                    {
                        createdAt: new Date(),
                        keywordTranslate: "admin.transactions.add",
                        method: "add",
                        mode: "admin",
                        type: "admin",
                        value,
                        userIdentify: `${message.author.username} \`${message.author.id}\``
                    }
                );

        return await msg.edit({
            content: `${e.CheckV} | Todos os usuários selecionados receberam ${value.currency()} Safiras.\n👥 | ${users.map(u => `${u?.username}`).join(", ")}`.limit("MessageContent")
        });
    }

    async function remove() {

        for await (const user of users)
            if (user?.id)
                await Database.editBalance(
                    user.id,
                    {
                        createdAt: new Date(),
                        keywordTranslate: "admin.transactions.remove",
                        method: "sub",
                        mode: "admin",
                        type: "admin",
                        value,
                        userIdentify: `${message.author.username} \`${message.author.id}\``
                    }
                );

        return await msg.edit({
            content: `${e.CheckV} | Todos os usuários selecionados perderam ${value.currency()} Safiras.\n👥 | ${users.map(u => `${u?.username}`).join(", ")}`.limit("MessageContent")
        });
    }

    async function set() {

        for await (const user of users)
            if (user?.id)
                await Database.editBalance(
                    user.id,
                    {
                        createdAt: new Date(),
                        keywordTranslate: "admin.transactions.set",
                        method: "set",
                        mode: "admin",
                        type: "admin",
                        value,
                        userIdentify: `${message.author.username} \`${message.author.id}\``
                    }
                );

        return await msg.edit({
            content: `${e.CheckV} | Todos os usuários selecionados tiveram as Safiras reconfiguradas para ${value.currency()}.\n👥 | ${users.map(u => `${u?.username}`).join(", ")}`.limit("MessageContent")
        });
    }

}