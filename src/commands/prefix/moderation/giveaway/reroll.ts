import { Message } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { GiveawayManager } from "../../../../managers";
import giveawayreroll from "../../../slash/moderation/giveaway/rerrol";

export default async function reroll(message: Message<true>, giveawayId: string, args: string[]) {

    const { userLocale: locale } = message;
    const giveaway = GiveawayManager.cache.get(giveawayId);

    if (!giveaway)
        return await message.reply({
            content: t("giveaway.not_found", { locale, e })
        });

    return giveawayreroll(message, giveawayId, parseInt(args[2]));

}