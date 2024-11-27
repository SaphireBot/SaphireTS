import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import Stop from "../../../structures/stop/stop";

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
    name: "stop",
    // name_localizations: getLocalizations("stop.name"),
    description: "Play STOP. It's amazing.",
    description_localizations: getLocalizations("stop.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    options: [
      {
        name: "letter",
        name_localizations: getLocalizations("stop.options.0.name"),
        description: "Choose a letter",
        description_localizations: getLocalizations("stop.options.0.description"),
        type: ApplicationCommandOptionType.String,
        max_value: 1,
        min_value: 1,
        autocomplete: true,
      },

      {
        type: ApplicationCommandOptionType.String,
        name: "language",
        name_localizations: getLocalizations("fastclick.options.0.name"),
        description: "Available languages",
        description_localizations: getLocalizations("fastclick.options.0.description"),
        autocomplete: true,
      },
    ],
  },
  additional: {
    category: "games",
    admin: false,
    staff: false,
    api_data: {
      name: "stop",
      description: "Jogue STOP (adedonha), é muito legal.",
      category: "Diversão",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("stop.name") || {},
          ),
        ),
      ),
      tags: [],
      perms: {
        user: [],
        bot: [],
      },
    },
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => await new Stop(interaction).start(),
  },
};