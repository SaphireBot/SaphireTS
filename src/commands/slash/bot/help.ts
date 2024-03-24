import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import lauch from "../../functions/help/lauch";

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
    name: "help",
    name_localizations: getLocalizations("help.name"),
    description: "[bot] A simple help command",
    description_localizations: getLocalizations("help.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "command",
        name_localizations: getLocalizations("help.options.0.name"),
        description: "Choose a command to see it info",
        description_localizations: getLocalizations("help.options.0.description"),
        autocomplete: true
      }
    ]
  },
  additional: {
    category: "bot",
    admin: false,
    staff: false,
    api_data: {
      name: "ajuda",
      description: "Um simples comando de ajuda",
      category: "Saphire",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("help.name") || {}
          )
        )
      ),
      tags: [],
      perms: {
        user: [],
        bot: []
      }
    },
    execute: async (interaction: ChatInputCommandInteraction) => await lauch(interaction)
  }
};