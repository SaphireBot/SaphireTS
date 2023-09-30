import { ButtonStyle, Message, PermissionsBitField } from "discord.js";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import noargs from "./giveaway/noargs";
import format from "./giveaway/format";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { GiveawayManager } from "../../../managers";
import Giveaway from "../../../structures/giveaway/giveaway";

export default {
    name: "giveaway",
    description: "Create and manage giveaway in guild",
    aliases: ["gw", "sorteio", "プレゼント", "tas", "sorteo", "draw", "auslosung"],
    category: "moderation",
    api_data: {
        category: "Moderação",
        synonyms: ["gw", "sorteio", "プレゼント", "tas", "sorteo", "draw", "auslosung"],
        tags: [],
        perms: {
            user: [DiscordPermissons.ManageEvents],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[]) {

        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
            return await permissionsMissing(message, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

        const argument = (args[0] || "").toLowerCase();

        if (!argument)
            return noargs(message);

        const data = [
            {
                key: "reroll",
                values: ["r", "rerollear", "relancer", "neuauslosung", "reroll", "resortear", "もう一度転がる", "re-tirage", "retirage"]
            },
            {
                key: "list",
                values: ["l", "list", "lista", "liste", "リスト"]
            },
            {
                key: "reset",
                values: ["zurücksetzen", "reset", "resetar", "リセット", "réinitialiser", "restart"]
            },
            {
                key: "delete",
                values: ["d", "löschen", "del", "delete", "borrar", "supprimer", "削除"]
            },
            {
                key: "finish",
                values: ["f", "beenden", "finalizar", "end", "terminer", "terminar", "acabar", "end", "終了"]
            },
            {
                key: "info",
                values: ["i", "info", "informações", "情報"]
            }
        ];

        for (const { key, values } of data)
            if (values.includes(argument))
                return format(message, args[1], key as any);

        for (const str of args) {
            const giveaway = GiveawayManager.cache.get(str);
            if (giveaway) return showTargetMessageOptions(giveaway);
        }

        return await message.reply({ content: t("giveaway.message.format.args_not_supported", { e, locale: message.userLocale }) });

        async function showTargetMessageOptions(giveaway: Giveaway) {

            return await message.reply({
                content: t("giveaway.message.format.target", { locale: message.userLocale, e, giveaway }),
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            custom_id: JSON.stringify({ c: "giveaway", src: "delete", gwId: giveaway.MessageID }),
                            emoji: e.Trash,
                            label: "Deletar",
                            style: ButtonStyle.Danger
                        },
                        {
                            type: 2,
                            custom_id: JSON.stringify({ c: "giveaway", src: "finish", gwId: giveaway.MessageID }),
                            emoji: "📨",
                            label: "Finalizar",
                            style: ButtonStyle.Primary,
                            disabled: !giveaway.Actived
                        },
                        {
                            type: 2,
                            custom_id: JSON.stringify({ c: "giveaway", src: "reset", gwId: giveaway.MessageID }),
                            emoji: "🔄",
                            label: "Resetar",
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            custom_id: JSON.stringify({ c: "giveaway", src: "reroll", gwId: giveaway.MessageID }),
                            emoji: e.Tada,
                            label: "Reroll",
                            style: ButtonStyle.Primary,
                            disabled: !giveaway.Actived
                        },
                        {
                            type: 2,
                            custom_id: JSON.stringify({ c: "giveaway", src: "info", gwId: giveaway.MessageID }),
                            emoji: e.Tada,
                            label: "Info",
                            style: ButtonStyle.Primary
                        }
                    ]
                }].asMessageComponents()
            });
        }

    }
};