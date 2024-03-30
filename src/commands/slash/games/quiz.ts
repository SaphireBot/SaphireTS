import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { BrandQuiz, FlagQuiz } from "../../../structures/quiz";
import creditsFlags from "./quiz/credits.flags";
import creditsBrands from "./quiz/credits.brands";
import points from "./quiz/points";

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
            type: ApplicationCommandOptionType.String,
            name: "language",
            name_localizations: getLocalizations("quiz.options.0.options.0.name"),
            description: "Available languages",
            description_localizations: getLocalizations("quiz.options.0.options.0.description"),
            autocomplete: true
          },
          {
            name: "style",
            name_localizations: getLocalizations("quiz.options.0.options.1.name"),
            description: "What type do you rather?",
            description_localizations: getLocalizations("quiz.options.0.options.1.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "Normal (8 seconds to reply)",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.0"),
                value: "normal"
              },
              {
                name: "Faster (4 seconds to reply)",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.1"),
                value: "fast"
              }
            ]
          },
          {
            name: "mode",
            name_localizations: getLocalizations("quiz.options.0.options.2.name"),
            description: "Solo or in party?",
            description_localizations: getLocalizations("quiz.options.0.options.2.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "Solo (Play with yourself)",
                name_localizations: getLocalizations("quiz.options.0.options.2.choices.0"),
                value: "solo"
              },
              {
                name: "Party (Play with everyone)",
                name_localizations: getLocalizations("quiz.options.0.options.2.choices.1"),
                value: "party"
              }
            ]
          },
          {
            name: "answers",
            name_localizations: getLocalizations("quiz.options.0.options.3.name"),
            description: "What answers mode do you rather?",
            description_localizations: getLocalizations("quiz.options.0.options.3.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "Alternatives",
                name_localizations: getLocalizations("quiz.options.0.options.3.choices.0"),
                value: "alternatives"
              },
              {
                name: "Keyboard",
                name_localizations: getLocalizations("quiz.options.0.options.3.choices.1"),
                value: "keyboard"
              }
            ]
          },
          {
            name: "options",
            name_localizations: getLocalizations("quiz.options.0.options.4.name"),
            description: "Some options from quiz game",
            description_localizations: getLocalizations("quiz.options.0.options.4.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "My points",
                name_localizations: getLocalizations("quiz.options.0.options.4.choices.0"),
                value: "points"
              },
              {
                name: "Credits",
                name_localizations: getLocalizations("quiz.options.0.options.4.choices.1"),
                value: "credits"
              }
            ]
          }
        ]
      },
      {
        name: "brands",
        name_localizations: getLocalizations("quiz.options.1.name"),
        description: "[games] A quiz with too much brands",
        description_localizations: getLocalizations("quiz.options.1.description"),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: "language",
            name_localizations: getLocalizations("quiz.options.0.options.0.name"),
            description: "Available languages",
            description_localizations: getLocalizations("quiz.options.0.options.0.description"),
            autocomplete: true
          },
          {
            name: "style",
            name_localizations: getLocalizations("quiz.options.0.options.1.name"),
            description: "What type do you rather?",
            description_localizations: getLocalizations("quiz.options.0.options.1.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "Normal (8 seconds to reply)",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.0"),
                value: "normal"
              },
              {
                name: "Faster (4 seconds to reply)",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.1"),
                value: "fast"
              }
            ]
          },
          {
            name: "mode",
            name_localizations: getLocalizations("quiz.options.0.options.2.name"),
            description: "Solo or in party?",
            description_localizations: getLocalizations("quiz.options.0.options.2.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "Solo (Play with yourself)",
                name_localizations: getLocalizations("quiz.options.0.options.2.choices.0"),
                value: "solo"
              },
              {
                name: "Party (Play with everyone)",
                name_localizations: getLocalizations("quiz.options.0.options.2.choices.1"),
                value: "party"
              }
            ]
          },
          {
            name: "answers",
            name_localizations: getLocalizations("quiz.options.0.options.3.name"),
            description: "What answers mode do you rather?",
            description_localizations: getLocalizations("quiz.options.0.options.3.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "Alternatives",
                name_localizations: getLocalizations("quiz.options.0.options.3.choices.0"),
                value: "alternatives"
              },
              {
                name: "Keyboard",
                name_localizations: getLocalizations("quiz.options.0.options.3.choices.1"),
                value: "keyboard"
              }
            ]
          },
          {
            name: "options",
            name_localizations: getLocalizations("quiz.options.0.options.4.name"),
            description: "Some options from quiz game",
            description_localizations: getLocalizations("quiz.options.0.options.4.description"),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "My points",
                name_localizations: getLocalizations("quiz.options.0.options.4.choices.0"),
                value: "points"
              },
              {
                name: "Credits",
                name_localizations: getLocalizations("quiz.options.0.options.4.choices.1"),
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

      const quiz = options.getSubcommand() as "flags" | "brands";
      const option = (options.getString("options") || "play") as "play" | "points" | "credits";
      if (option === "points") return await points(interaction, quiz);

      if (quiz === "flags") {
        if (option === "play") return await new FlagQuiz(interaction).checkIfChannelIsUsed();
        if (option === "credits") return await creditsFlags(interaction);
      }

      if (quiz === "brands") {
        if (option === "play") return await new BrandQuiz(interaction).checkIfChannelIsUsed();
        if (option === "credits") return await creditsBrands(interaction);
      }

    }
  }
};