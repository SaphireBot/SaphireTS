import { MessageFlags, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import emojis from "./emojis";
import features from "./features";
import numbers from "./numbers";
import images from "./images";
import suplement from "./suplements";
import roles from "./roles";
import serverinfo, { serverinfoCache } from ".";
import client from "../../../saphire";
import refresh from "./refresh";

export default async function redirect(
    interaction: StringSelectMenuInteraction<"cached">,
    data: { c: "serverinfo", id: string, uid: string },
) {

    const { user, userLocale: locale } = interaction;

    if (user.id !== data?.uid)
        return await interaction.reply({
            content: t("serverinfo.you_cannot_click_here", { e, locale }),
            flags: [MessageFlags.Ephemeral],
        });

    const pageRequired = interaction.values[0];

    const execute = {
        "firstPage": serverinfo,
        "numbers": numbers,
        "images": images,
        "suplement": suplement,
        "features": features,
        "emojis": emojis,
        "roles": roles,
        "refresh": refresh,
    }[pageRequired];

    const guild = serverinfoCache.get(data.id) || await client.getGuild(data.id);

    if (!guild)
        return await interaction.update({
            content: t("serverinfo.not_found", { e, locale }),
            embeds: [], components: [],
        }).catch(() => { });

    if (!execute) return console.log("Function Not Found - da54das534d");

    if (pageRequired === "roles")
        return await roles(interaction, data as any, guild);

    return await execute(interaction as never, guild as never);
}