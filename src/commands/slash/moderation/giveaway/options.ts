import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import permissionsMissing from "../../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../../util/constants";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import deleteGiveaway from "./delete";
import reset from "./reset";
import finish from "./finish";

export default async function giveawayOptions(interaction: ChatInputCommandInteraction<"cached">) {

    if (!interaction.member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    const { options, userLocale: locale } = interaction;

    // "delete" | "reset" | "finish" | "info"
    const option: string | null = options.getString("method");
    const giveawayId = options.getString("giveaway");

    switch (option) {
        case "delete": deleteGiveaway(interaction, giveawayId); break;
        case "reset": reset(interaction, giveawayId); break;
        case "finish": finish(interaction); break;
        // case 'info': infoGiveaway(interaction, guildData); break;
        default:
            await interaction.reply({
                content: t("giveaway.no_option_found", { e, locale })
            });
            break;
    }
    return;
}