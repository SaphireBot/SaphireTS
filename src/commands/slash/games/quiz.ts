import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { BrandQuiz, FlagQuiz, QuizCharactersManager } from "../../../structures/quiz";
import {
  creditsBrands,
  creditsFlags,
  points,
  optionsCharacters,
  view,
  indicate,
  checkBeforeIniciate,
} from "./quiz/index";

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
            autocomplete: true,
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
                value: "normal",
              },
              {
                name: "Faster (4 seconds to reply)",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.1"),
                value: "fast",
              },
            ],
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
                value: "solo",
              },
              {
                name: "Party (Play with everyone)",
                name_localizations: getLocalizations("quiz.options.0.options.2.choices.1"),
                value: "party",
              },
            ],
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
                value: "alternatives",
              },
              {
                name: "Keyboard",
                name_localizations: getLocalizations("quiz.options.0.options.3.choices.1"),
                value: "keyboard",
              },
            ],
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
                value: "points",
              },
              {
                name: "Credits",
                name_localizations: getLocalizations("quiz.options.0.options.4.choices.1"),
                value: "credits",
              },
            ],
          },
        ],
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
            autocomplete: true,
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
                value: "normal",
              },
              {
                name: "Faster (4 seconds to reply)",
                name_localizations: getLocalizations("quiz.options.0.options.1.choices.1"),
                value: "fast",
              },
            ],
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
                value: "solo",
              },
              {
                name: "Party (Play with everyone)",
                name_localizations: getLocalizations("quiz.options.0.options.2.choices.1"),
                value: "party",
              },
            ],
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
                value: "alternatives",
              },
              {
                name: "Keyboard",
                name_localizations: getLocalizations("quiz.options.0.options.3.choices.1"),
                value: "keyboard",
              },
            ],
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
                value: "points",
              },
              {
                name: "Credits",
                name_localizations: getLocalizations("quiz.options.0.options.4.choices.1"),
                value: "credits",
              },
            ],
          },
        ],
      },
      {
        name: "characters",
        name_localizations: getLocalizations("quiz.options.2.name"),
        description: "[games] A quiz with anime, series, movies characters",
        description_localizations: getLocalizations("quiz.options.2.description"),
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: "indicate",
            name_localizations: getLocalizations("quiz.options.2.options.0.name"),
            description: "[games] Indicate a character to this Quiz",
            description_localizations: getLocalizations("quiz.options.2.options.0.description"),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "image",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.0.name"),
                description: "[games] Character's image",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.0.description"),
                type: ApplicationCommandOptionType.Attachment,
                required: true,
              },
              {
                name: "name",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.1.name"),
                description: "[games] Character's origianl name",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.1.description"),
                type: ApplicationCommandOptionType.String,
                required: true,
              },
              {
                name: "artwork",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.2.name"),
                description: "[games] Character's original artwork",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.2.description"),
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
              },
              {
                name: "gender",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.3.name"),
                description: "[games] Character's gender",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.3.description"),
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                  {
                    name: "Male",
                    name_localizations: getLocalizations("quiz.options.2.options.0.options.3.choices.0"),
                    value: "male",
                  },
                  {
                    name: "Female",
                    name_localizations: getLocalizations("quiz.options.2.options.0.options.3.choices.1"),
                    value: "female",
                  },
                  {
                    name: "Others",
                    name_localizations: getLocalizations("quiz.options.2.options.0.options.3.choices.2"),
                    value: "others",
                  },
                ],
              },
              {
                name: "category",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.4.name"),
                description: "[games] Artwork category",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.4.description"),
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: QuizCharactersManager.categories.map((category, i) => ({
                  name: category,
                  name_localizations: getLocalizations(`quiz.options.2.options.0.options.4.choices.${i}`),
                  value: category,
                })),
              },
              {
                name: "another_names",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.5.name"),
                description: "[games] Other character names separated by commas",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.5.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "credits",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.6.name"),
                description: "[games] Image's website credits",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.6.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "portuguese_name",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.7.name"),
                description: "[games] Character's name in portuguese",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.7.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "german_name",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.8.name"),
                description: "[games] Character's name in german",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.8.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "english_name",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.9.name"),
                description: "[games] Character's name in english",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.9.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "spanish_name",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.10.name"),
                description: "[games] Character's name in spanish",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.10.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "french_name",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.11.name"),
                description: "[games] Character's name in franch",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.11.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "japanese_name",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.12.name"),
                description: "[games] Character's name in japanese",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.12.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "chinese_name",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.13.name"),
                description: "[games] Character's name in chinese",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.13.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "portuguese_artwork",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.14.name"),
                description: "[games] Artwork's name in portuguese",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.14.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "german_artwork",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.15.name"),
                description: "[games] Artwork's name in german",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.15.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "english_artwork",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.16.name"),
                description: "[games] Artwork's name in english",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.16.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "spanish_artwork",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.17.name"),
                description: "[games] Artwork's name in spanish",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.17.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "french_artwork",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.18.name"),
                description: "[games] Artwork's name in franch",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.18.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "japanese_artwork",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.19.name"),
                description: "[games] Artwork's name in japanese",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.19.description"),
                type: ApplicationCommandOptionType.String,
              },
              {
                name: "chinese_artwork",
                name_localizations: getLocalizations("quiz.options.2.options.0.options.20.name"),
                description: "[games] Artwork's name in chinese",
                description_localizations: getLocalizations("quiz.options.2.options.0.options.20.description"),
                type: ApplicationCommandOptionType.String,
              },
            ],
          },
          {
            name: "options",
            name_localizations: getLocalizations("quiz.options.2.options.1.name"),
            description: "[games] Some options to this quiz",
            description_localizations: getLocalizations("quiz.options.2.options.1.description"),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "function",
                name_localizations: getLocalizations("quiz.options.2.options.1.options.0.name"),
                description: "[games] Choose a function to execute",
                description_localizations: getLocalizations("quiz.options.2.options.1.options.0.description"),
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                  {
                    name: "Credits",
                    name_localizations: getLocalizations("quiz.options.2.options.1.options.0.choices.0"),
                    value: "credits",
                  },
                  {
                    name: "Status",
                    name_localizations: getLocalizations("quiz.options.2.options.1.options.0.choices.1"),
                    value: "status",
                  },
                  {
                    name: "My points",
                    name_localizations: getLocalizations("quiz.options.2.options.1.options.0.choices.2"),
                    value: "points",
                  },
                  {
                    name: "[ADMIN ONLY] Transfer characters to principal Database",
                    name_localizations: getLocalizations("quiz.options.2.options.1.options.0.choices.3"),
                    value: "transfer",
                  },
                  {
                    name: "[ADMIN ONLY] Backup aproved's images from directory",
                    name_localizations: getLocalizations("quiz.options.2.options.1.options.0.choices.4"),
                    value: "backup",
                  },
                  {
                    name: "[ADMIN ONLY] Remove user from indication block",
                    name_localizations: getLocalizations("quiz.options.2.options.1.options.0.choices.5"),
                    value: "removeUserFromBlock",
                  },
                ],
              },
            ],
          },
          {
            name: "view",
            name_localizations: getLocalizations("quiz.options.2.options.2.name"),
            description: "[games] Select a character or search for them separated by commas",
            description_localizations: getLocalizations("quiz.options.2.options.2.description"),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "characters",
                name_localizations: getLocalizations("quiz.options.2.options.2.options.0.name"),
                description: "Choose some characters by separating them with commas",
                description_localizations: getLocalizations("quiz.options.2.options.2.options.0.description"),
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
              },
            ],
          },
          {
            name: "play",
            name_localizations: getLocalizations("quiz.options.2.options.3.name"),
            description: "[games] Start the Quiz in the chat",
            description_localizations: getLocalizations("quiz.options.2.options.3.description"),
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
    ],
  },
  additional: {
    category: "games",
    admin: false,
    staff: false,
    api_data: {
      name: "quiz",
      description: "Quizes são bom demais",
      category: "Diversão",
      synonyms: [],
      tags: [],
      perms: {
        user: [],
        bot: [],
      },
    },
    async execute(interaction: ChatInputCommandInteraction) {

      const { options } = interaction;

      const quiz = options.getSubcommand() as "flags" | "brands" | "indicate" | "options" | "view" | "play";
      const quizGroup = options.getSubcommandGroup() as "characters";
      const option = (options.getString("options") || "play") as "play" | "points" | "credits";
      if (option === "points") return await points(interaction, quiz as "flags" | "brands");

      if (quiz === "flags") {
        if (option === "play") return await new FlagQuiz(interaction).checkIfChannelIsUsed();
        if (option === "credits") return await creditsFlags(interaction);
      }

      if (quiz === "brands") {
        if (option === "play") return await new BrandQuiz(interaction).checkIfChannelIsUsed();
        if (option === "credits") return await creditsBrands(interaction);
      }

      if (quizGroup === "characters") {
        if (quiz === "play") return await checkBeforeIniciate(interaction as any);
        if (quiz === "indicate") return await indicate(interaction);
        if (quiz === "options") return await optionsCharacters(interaction);
        if (quiz === "view") return await view(interaction);
      }

    },
  },
};