import { Guild, StringSelectMenuInteraction } from "discord.js";
import serverinfo, { serverinfoCache } from ".";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { paginationData, tempPagesIndexes } from "./roles";
import client from "../../../saphire";

export default async function refresh(interaction: StringSelectMenuInteraction<"cached">, guild: Guild) {

    const { userLocale: locale, user } = interaction;

    await interaction.reply({
        content: t("serverinfo.refresh.loading", { e, locale }),
        ephemeral: true
    });

    serverinfoCache.delete(guild.id);
    delete paginationData[guild.id];
    delete tempPagesIndexes[user.id];

    const guildRefreshed = await client.getGuild(guild.id);

    if (!guildRefreshed)
        return await interaction.editReply({ content: t("serverinfo.not_found", { e, locale }) });

    serverinfoCache.set(guild.id, guildRefreshed);
    await serverinfo(interaction, [], true);
    return await interaction.editReply({ content: t("serverinfo.refresh.success", { e, locale }) });
}