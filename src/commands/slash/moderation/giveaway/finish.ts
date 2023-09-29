import { ButtonStyle, ChatInputCommandInteraction, ComponentType, PermissionsBitField } from "discord.js";
import { GiveawayManager } from "../../../../managers";
import permissionsMissing from "../../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../../util/constants";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";

export default async function finish(interaction: ChatInputCommandInteraction<"cached">) {

    const { userLocale: locale } = interaction;
    if (!interaction.member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    const giveaway = GiveawayManager.cache.get(interaction.options.getString("giveaway") as string);

    if (!giveaway)
        return await interaction.reply({
            content: t("giveaway.not_found", { e, locale }),
            ephemeral: true
        });

    if (!giveaway.Actived)
        return await interaction.reply({
            content: t("giveaway.options.finish.not_active", { e, locale, id: giveaway.MessageID }),
            components: [{
                type: 1,
                components: [
                    {
                        type: ComponentType.Button,
                        url: giveaway.MessageLink,
                        label: t("giveaway.giveawayKeyword", locale),
                        style: ButtonStyle.Link
                    }
                ]
            }],
            ephemeral: true
        });

    giveaway.clearTimeout();
    giveaway.start();

    return await interaction.reply({
        content: t("giveaway.options.finish.success", { e, locale }),
        ephemeral: true
    });
}