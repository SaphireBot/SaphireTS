import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import Database from "../../../database";
import pig from "../../functions/pig/pig";

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
    name: "piggy",
    name_localizations: getLocalizations("pig.name"),
    description: "[economy] Good luck with the piggy!",
    description_localizations: getLocalizations("pig.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      {
        name: "options",
        name_localizations: getLocalizations("pig.options.0.name"),
        description: "Some piggy command options",
        description_localizations: getLocalizations("pig.options.0.description"),
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          {
            name: "Try luck (1000 Safiras)",
            name_localizations: getLocalizations("pig.options.0.choices.0"),
            value: "try"
          },
          {
            name: "Piggy status",
            name_localizations: getLocalizations("pig.options.0.choices.1"),
            value: "status"
          }
        ]
      }
    ]
  },
  additional: {
    category: "economy",
    admin: false,
    staff: false,
    api_data: {
      name: "pig",
      description: "Boa sorte ao quebrar o porquinho",
      category: "Economia",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("pig.name") || {}
          )
        )
      ),
      tags: [],
      perms: {
        user: [],
        bot: []
      }
    },
    execute: async (interaction: ChatInputCommandInteraction) => await pig(interaction)
  }
};