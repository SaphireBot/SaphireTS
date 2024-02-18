import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import addRole from "./roles/add";

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
            description: "Select the members to recieve the roles",
            description_localizations: getLocalizations("role.options.0.options.0.description"),
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: "roles",
            name_localizations: getLocalizations("role.options.0.options.1.name"),
            description: "Select the members to recieve the roles",
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

      if (subCommand === "add") return await addRole(interaction);
      return await interaction.reply({ content: "sub_command_error#NOT_FOUND#61548" });

    }
  }
};