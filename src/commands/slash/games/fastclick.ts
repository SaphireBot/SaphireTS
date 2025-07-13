import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import FastClick from "../../../structures/fastclick/fastclick";

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
    name: "fastclick",
    name_localizations: getLocalizations("fastclick.name"),
    description: "[games] Are you the fastest?",
    description_localizations: getLocalizations("fastclick.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "language",
        name_localizations: getLocalizations("fastclick.options.0.name"),
        description: "Available languages",
        description_localizations: getLocalizations("fastclick.options.0.description"),
        autocomplete: true,
      },
      {
        type: ApplicationCommandOptionType.Integer,
        name: "buttons",
        name_localizations: getLocalizations("fastclick.options.1.name"),
        description: "How much button do you want? (Default: 5)",
        description_localizations: getLocalizations("fastclick.options.1.description"),
        min_value: 3,
        max_value: 25,
      },
      {
        type: ApplicationCommandOptionType.Integer,
        name: "points",
        name_localizations: getLocalizations("fastclick.options.2.name"),
        description: "How much points do you want? (Default: 15)",
        description_localizations: getLocalizations("fastclick.options.2.description"),
        min_value: 5,
        max_value: 1000,
      },
    ],
  },
  additional: {
    category: "games",
    admin: false,
    staff: false,
    api_data: {
      name: "fastclick",
      description: "O quão rápido você é?",
      category: "Diversão",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("fastclick.name") || {},
          ),
        ),
      ),
      tags: [],
      perms: {
        user: [],
        bot: [],
      },
    },
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => new FastClick(interaction),
  },
};