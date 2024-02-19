import { Message, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import add from "../../functions/role/add";
import remove from "../../functions/role/remove";
import info from "../../functions/role/info";
import permissionsMissing from "../../functions/permissionsMissing";

const translates = {
    aliases: [
        "rolle",
        "position",
        "cargo",
        "papel",
        "poste",
        "rôle",
        "役職",
        "役割",
        "职位",
        "角色"
    ],
    add: [
        "hinzufügen",
        "add",
        "añadir",
        "ajouter",
        "追加する",
        "adicionar",
        "添加",
        "legen",
        "put",
        "poner",
        "mettre",
        "置く",
        "放置"
    ],
    remove: [
        "entfernen",
        "löschen",
        "entnehmen",
        "remove",
        "delete",
        "takeout",
        "quitar",
        "borrar",
        "sacar",
        "enlever",
        "supprimer",
        "retirer",
        "削除する",
        "削除",
        "取り除く",
        "remover",
        "apagar",
        "tirar",
        "删除",
        "擦除",
        "取出",
        "del"
    ],
    info: [
        "informationen",
        "status",
        "daten",
        "information",
        "status",
        "data",
        "información",
        "estado",
        "datos",
        "informations",
        "statut",
        "données",
        "情報",
        "ステータス",
        "データ",
        "informações",
        "dados",
        "信息",
        "info",
        "i"
    ]
};

export default {
    name: "role",
    description: "Adicione cargos em um membro",
    aliases: translates.aliases,
    category: "moderation",
    api_data: {
        category: "Moderação",
        synonyms: translates.aliases,
        tags: [],
        perms: {
            user: [DiscordPermissons.ManageRoles],
            bot: [DiscordPermissons.ManageRoles]
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const method = (args?.[0]?.toLowerCase() || "").toLowerCase();

        if (translates.info.includes(method))
            return await info(message);

        if (!message.member?.permissions.has(PermissionFlagsBits.ManageRoles, true))
            return await permissionsMissing(message, [DiscordPermissons.ManageRoles], "Discord_you_need_some_permissions");

        if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles, true))
            return await permissionsMissing(message, [DiscordPermissons.ManageRoles], "Discord_client_need_some_permissions");

        if (translates.add.includes(method))
            return await add(message, args!);

        if (translates.remove.includes(method))
            return await remove(message, args!);

        return await message.reply({ content: "sub_args_error#NOT_FOUND#85942" });
    }
};