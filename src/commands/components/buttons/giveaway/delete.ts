import { ButtonInteraction, PermissionsBitField, Routes } from "discord.js";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import client from "../../../../saphire";
import permissionsMissing from "../../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../../util/constants";
import { GiveawayManager } from "../../../../managers";

export default async function deleteGiveaway(interaction: ButtonInteraction<"cached">, gwId?: string) {

    const { member, userLocale: locale } = interaction;

    if (!member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    if (!gwId)
        return await interaction.reply({
            content: t("giveaway.delete.id_source_not_found", { e, locale }),
            components: []
        });

    const giveaway = GiveawayManager.cache.get(gwId);

    if (!giveaway)
        return await interaction.update({
            content: t("giveaway.not_found", { e, locale }),
            components: []
        });

    await interaction.update({
        content: t("giveaway.options.delete.deleting", { e, locale }),
        components: []
    });

    await client.rest.delete(Routes.channelMessage(giveaway.ChannelId, giveaway.MessageID)).catch(() => { });
    const success = giveaway.delete();

    if (success)
        await client.rest.delete(
            Routes.channelMessage(giveaway.ChannelId, giveaway.MessageID)
        ).catch(() => { });

    return await interaction.editReply({
        content: success
            ? t("giveaway.options.delete.success", { e, locale })
            : t("giveaway.options.delete.fail", { e, locale })
    });
}