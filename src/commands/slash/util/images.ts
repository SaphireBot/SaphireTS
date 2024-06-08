import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import images from "../../functions/images/images";

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
    name: "images",
    name_localizations: getLocalizations("images.name"),
    description: "[util] Search for some images",
    description_localizations: getLocalizations("images.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      {
        name: "search",
        name_localizations: getLocalizations("images.options.0.name"),
        description: "Search for some images",
        description_localizations: getLocalizations("images.options.0.description"),
        type: ApplicationCommandOptionType.String,
        required: true
      }
    ]
  },
  additional: {
    category: "util",
    admin: false,
    staff: false,
    api_data: {
      name: "imagens",
      description: "Pesquise por algumas imagens",
      category: "Utilidades",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("images.name") || {}
          )
        )
      ),
      tags: ["new"],
      perms: {
        user: [],
        bot: []
      }
    },
    execute: async (interaction: ChatInputCommandInteraction) => await images(interaction)
  }
};