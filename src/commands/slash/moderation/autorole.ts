import { ApplicationCommandType, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import autorole from "../../functions/autorole";
import permissionsMissing from "../../functions/permissionsMissing";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
    data: {
        type: ApplicationCommandType.ChatInput,
        application_id: client.user?.id,
        guild_id: "",
        name: "autorole",
        description: "[moderation] A means of automating the handover of roles when a new member joins into guild",
        description_localizations: getLocalizations("autorole.description"),
        default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
        dm_permission: false,
        nsfw: false,
    },
    additional: {
        category: "moderation",
        admin: false,
        staff: false,
        api_data: {
            name: "autorole",
            description: "Um meio de automatizar a transferência de cargos quando um novo membro entrar no servidor",
            category: "Moderação",
            synonyms: [],
            tags: [],
            perms: {
                user: [DiscordPermissons.ManageRoles],
                bot: [DiscordPermissons.ManageRoles],
            },
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            if (!interaction.member?.permissions.has(PermissionFlagsBits.ManageRoles, true))
                return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_you_need_some_permissions");

            if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles, true))
                return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_client_need_some_permissions");

            return await autorole(interaction);

        },
    },
};