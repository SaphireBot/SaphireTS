import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import FlagQuiz from "../../../structures/quiz/flags";
import credits from "./flags/credits";
import points from "./flags/points";
// import FlagQuiz from "../../../structures/quiz/flags";

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
    name: "quiz",
    // name_localizations: getLocalizations("COMMANDNAME.FIELD"),
    description: "[games] A funny way to play quiz matches",
    description_localizations: getLocalizations("quiz.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      {
        name: "flags",
        name_localizations: getLocalizations("quiz.options.0.name"),
        description: "[games] A quiz of all flag's countries",
        description_localizations: getLocalizations("quiz.options.0.description"),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "language",
            name_localizations: getLocalizations("quiz.options.0.options.0.name"),
            description: "Choose a language to play this game. Default: \"Portuguese, Brazil\"",
            description_localizations: getLocalizations("quiz.options.0.options.0.description"),
            type: ApplicationCommandOptionType.String
          },
          {
            name: "options",
            name_localizations: getLocalizations("quiz.options.0.options.1.name"),
            description: "Some options from quiz game",
            description_localizations: getLocalizations("quiz.options.0.options.1.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "New match",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.0"),
                value: "play"
              },
              {
                name: "My points",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.1"),
                value: "points"
              },
              {
                name: "Credits",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.2"),
                value: "credits"
              }
            ]
          }
        ]
      }
    ]
  },
  additional: {
    category: "games",
    admin: false,
    staff: false,
    api_data: {
      name: "quiz",
      description: "Quizes são bom demais",
      category: "Jogos",
      synonyms: [],
      tags: [],
      perms: {
        user: [],
        bot: []
      }
    },
    async execute(interaction: ChatInputCommandInteraction) {

      const { options } = interaction;

      const quiz = options.getSubcommand();

      if (quiz === "flags") {
        const option = (options.getString("options") || "play") as "play" | "points" | "credits";

        if (option === "play")
          return await new FlagQuiz(interaction).checkIfChannelIsUsed();

        if (option === "credits")
          return await credits(interaction);

        if (option === "points")
          return await points(interaction);
      }

    }
  }
};