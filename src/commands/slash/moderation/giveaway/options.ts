import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import permissionsMissing from "../../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../../util/constants";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import deleteGiveaway from "./delete";
import reset from "./reset";
import finish from "./finish";
import info from "./info";

export default async function options(interaction: ChatInputCommandInteraction<"cached">) {

    if (!interaction.member?.permissions.has(PermissionsBitField.Flags.ManageEvents, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageEvents], "Discord_you_need_some_permissions");

    const { options, userLocale: locale } = interaction;

    // "delete" | "reset" | "finish" | "info"
    const option: string | null = options.getString("method");
    const giveawayId = options.getString("giveaway") || undefined;

    switch (option) {
        case "delete": deleteGiveaway(interaction, giveawayId); break;
        case "reset": reset(interaction, giveawayId); break;
        case "finish": finish(interaction); break;
        case "info": info(interaction); break;
        default:
            await interaction.reply({
                content: t("giveaway.no_option_found", { e, locale })
            });
            break;
    }
    return;
}