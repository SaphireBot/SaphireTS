import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ComponentType, MessageFlags, PermissionsBitField } from "discord.js";
import { GiveawayManager } from "../../../../managers";
import permissionsMissing from "../../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../../util/constants";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";

export default async function finish(
    interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">,
    giveawayIdFromButtonInteraction?: string,
) {

    const { userLocale: locale } = interaction;
    if (!interaction.member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    const giveawayId = interaction.isChatInputCommand()
        ? interaction.options.getString("giveaway") as string
        : giveawayIdFromButtonInteraction;

    if (!giveawayId)
        return interaction.isChatInputCommand()
            ? await interaction.reply({
                content: t("giveaway.options.delete.id_source_not_found", { e, locale }),
            })
            : await interaction.update({
                content: t("giveaway.options.delete.id_source_not_found", { e, locale }),
            });

    const giveaway = GiveawayManager.cache.get(giveawayId);

    if (!giveaway)
        return await interaction.reply({
            content: t("giveaway.not_found", { e, locale }),
            flags: [MessageFlags.Ephemeral],
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
                        style: ButtonStyle.Link,
                    },
                ],
            }],
            flags: [MessageFlags.Ephemeral],
        });

    giveaway.clearTimeout();
    giveaway.start();

    return await interaction.reply({
        content: t("giveaway.options.finish.success", { e, locale }),
        flags: [MessageFlags.Ephemeral],
    });
}