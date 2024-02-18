import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import addRole from "./roles/add";
import permissionsMissing from "../../functions/permissionsMissing";
import removeRole from "./roles/remove";

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
    name: "role",
    name_localizations: getLocalizations("role.name"),
    description: "[moderation] Manager the roles server easier",
    description_localizations: getLocalizations("role.description"),
    default_member_permissions: PermissionsBitField.Flags.ManageRoles.toString(),
    dm_permission: false,
    nsfw: false,
    options: [
      {
        name: "add",
        name_localizations: getLocalizations("role.options.0.name"),
        description: "[moderation] Add roles to members",
        description_localizations: getLocalizations("role.options.0.description"),
        type: 1,
        options: [
          {
            name: "members",
            name_localizations: getLocalizations("role.options.0.options.0.name"),
            description: "selects all members to receive the roles",
            description_localizations: getLocalizations("role.options.0.options.0.description"),
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: "roles",
            name_localizations: getLocalizations("role.options.0.options.1.name"),
            description: "Select all roles to be added",
            description_localizations: getLocalizations("role.options.0.options.1.description"),
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: "remove",
        name_localizations: getLocalizations("role.options.1.name"),
        description: "[moderation] Remove roles from members",
        description_localizations: getLocalizations("role.options.1.description"),
        type: 1,
        options: [
          {
            name: "members",
            name_localizations: getLocalizations("role.options.1.options.0.name"),
            description: "selects all members to remove the roles",
            description_localizations: getLocalizations("role.options.0.options.0.description"),
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: "roles",
            name_localizations: getLocalizations("role.options.1.options.1.name"),
            description: "Select all roles to be removed",
            description_localizations: getLocalizations("role.options.0.options.1.description"),
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      }
    ]
  },
  additional: {
    category: "Moderação",
    admin: false,
    staff: false,
    api_data: {
      name: "role",
      description: "Adicione cargos em um membro",
      category: "moderation",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("role.name") || {}
          )
        )
      ),
      tags: [],
      perms: {
        user: [DiscordPermissons.ManageRoles],
        bot: [DiscordPermissons.ManageRoles]
      }
    },
    async execute(interaction: ChatInputCommandInteraction<"cached">) {

      const { options } = interaction;
      const subCommand = options.getSubcommand();

      if (!interaction.member?.permissions.has(PermissionFlagsBits.ManageRoles, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_you_need_some_permissions");

      if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_client_need_some_permissions");

      if (subCommand === "add") return await addRole(interaction);
      if (subCommand === "remove") return await removeRole(interaction);

      return await interaction.reply({ content: "sub_command_error#NOT_FOUND#61548" });

    }
  }
};