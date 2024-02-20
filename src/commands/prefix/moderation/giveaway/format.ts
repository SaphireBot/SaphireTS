import { Message, PermissionFlagsBits, ButtonStyle } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { GiveawayManager } from "../../../../managers";
import permissionsMissing from "../../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../../util/constants";
import infoGiveaway from "../../../slash/moderation/giveaway/info";
import listGiveaway from "../../../slash/moderation/giveaway/list";
import deleteGiveaway from "../../../slash/moderation/giveaway/delete";
import reroll from "./reroll";
import reset from "../../../slash/moderation/giveaway/reset";

export default async function format(
    message: Message<true>,
    args: string[],
    key: "reroll" | "reset" | "delete" | "finish" | "info" | "list"
) {

    /**
     * TODO: Reroll & reset
     */
    const { userLocale: locale, member } = message;
    const giveawayId = args[1];

    if (key === "info")
        return infoGiveaway(message, giveawayId);

    if (key === "list")
        return listGiveaway(message);

    if (["reroll", "reset", "delete", "finish"].includes(key))
        if (!member?.permissions.has(PermissionFlagsBits.ManageEvents, true))
            return permissionsMissing(message, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    if (!giveawayId)
        return await message.reply({
            content: t("giveaway.message.format.id_not_given", { locale, e })
        });

    if (key === "delete") return deleteGiveaway(message, giveawayId);
    if (key === "reroll") return reroll(message, giveawayId, args);
    if (key === "reset") return reset(message, giveawayId);

    if (key === "finish") {

        const giveaway = GiveawayManager.cache.get(giveawayId);

        if (!giveaway)
            return await message.reply({
                content: t("giveaway.not_found", { locale, e })
            });

        return await message.reply({
            content: t("giveaway.message.format.finish", { locale, e, giveaway }),
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        custom_id: JSON.stringify({ c: "giveaway", src: "delete", gwId: giveaway.MessageID }),
                        emoji: e.Trash,
                        label: t("giveaway.components.cancel", locale),
                        style: ButtonStyle.Success
                    },
                    {
                        type: 2,
                        custom_id: JSON.stringify({ c: "giveaway", src: "finish", gwId: giveaway.MessageID }),
                        emoji: "📨",
                        label: t("giveaway.components.confirm", locale),
                        style: ButtonStyle.Danger,
                        disabled: !giveaway.Actived
                    }
                ]
            }].asMessageComponents()
        });

    }

    return await message.reply({
        content: t("giveaway.format.message.not_found", { e, locale })
    });

}