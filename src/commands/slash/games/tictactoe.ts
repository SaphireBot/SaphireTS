import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import Tictactoe from "../../../structures/tictactoe/tictactoe";
import tictactoeStatus from "../../../structures/tictactoe/status";
import tictactoeCredits from "../../../structures/tictactoe/credits";

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
    name: "tictactoe",
    name_localizations: getLocalizations("tictactoe.name"),
    description: "[games] Just a simple tictactoe game",
    description_localizations: getLocalizations("tictactoe.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    // This is to enable DM Global commands
    // integration_types: [0, 1],
    // contexts: [0, 1, 2],
    options: [
      {
        name: "play",
        name_localizations: getLocalizations("tictactoe.options.0.name"),
        description: "[games] Play tictactoe with someone",
        description_localizations: getLocalizations("tictactoe.options.0.description"),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "opponent",
            name_localizations: getLocalizations("tictactoe.options.0.options.0.name"),
            description: "Choose an opponent",
            description_localizations: getLocalizations("tictactoe.options.0.options.0.description"),
            type: ApplicationCommandOptionType.User,
            required: true,
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
      {
        name: "options",
        name_localizations: getLocalizations("tictactoe.options.1.name"),
        description: "[games] Some options from tictactoe game",
        description_localizations: getLocalizations("tictactoe.options.1.description"),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            // name_localizations: getLocalizations("tictactoe.options.1.options.name"),
            description: "See status from tictactoe game",
            description_localizations: getLocalizations("tictactoe.options.1.options.0.description"),
            type: ApplicationCommandOptionType.User,
          },
          {
            type: ApplicationCommandOptionType.String,
            name: "credits",
            name_localizations: getLocalizations("tictactoe.options.1.options.1.name"),
            description: "The credits from this game",
            description_localizations: getLocalizations("tictactoe.options.1.options.1.description"),
            options: [
              {
                name: "Developement Credits",
                value: "credits",
              },
            ],
          },
        ],
      },
    ],
  },
  additional: {
    category: "Diversão",
    admin: false,
    staff: false,
    api_data: {
      name: "jogodavelha",
      description: "Um simples jogo da velha",
      category: "Diversão",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("tictactoe.name") || {},
          ),
        ),
      ),
      tags: ["new", "building"],
      perms: {
        user: [],
        bot: [],
      },
    },
    async execute(interaction: ChatInputCommandInteraction<"cached">) {

      const { options } = interaction;

      const option = options.getUser("status");
      if (option) return await tictactoeStatus(interaction);

      const credits = options.getString("credits") === "credits";
      if (credits) return await tictactoeCredits(interaction);

      if (options.getMember("opponent"))
        return new Tictactoe(interaction);
    },
  },
};