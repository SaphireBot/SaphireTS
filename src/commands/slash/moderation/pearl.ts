import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import configuration from "../../functions/pearl/configuration.pearl";
import { PearlsManager } from "../../../managers";
// import { e } from "../../../util/json";
// import { t } from "../../../translator";

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
    name: "pearl",
    name_localizations: getLocalizations("pearl.name"),
    description: "[moderation] Pearls must be show to everybody",
    description_localizations: getLocalizations("pearl.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    options: [
      {
        name: "config",
        name_localizations: getLocalizations("pearl.options.0.name"),
        description: "[ADMIN] Configure the reaction limit and sending channel",
        description_localizations: getLocalizations("pearl.options.0.description"),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "limit",
            name_localizations: getLocalizations("pearl.options.0.options.0.name"),
            description: "How many reactions should the message have? (0 turn it off | Max: 100)",
            description_localizations: getLocalizations("pearl.options.0.options.0.description"),
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: PearlsManager.min,
            max_value: PearlsManager.max
          },
          {
            name: "channel",
            name_localizations: getLocalizations("pearl.options.0.options.1.name"),
            description: "Where the message must be sended?",
            description_localizations: getLocalizations("pearl.options.0.options.1.description"),
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
          }
        ]
      },
      // {
      //   name: "status",
      //   description: "[USER] Acompanhe o status do sistema de estrelas",
      //   type: ApplicationCommandOptionType.Subcommand,
      //   options: [
      //     {
      //       name: "method",
      //       description: "Métodos disponíveis neste comando",
      //       type: ApplicationCommandOptionType.String,
      //       required: true,
      //       choices: [
      //         {
      //           name: "Total de estrelas enviadas no servidor",
      //           value: "sended"
      //         },
      //         {
      //           name: "Quantas estrelas eu tenho?",
      //           value: "myStars"
      //         },
      //         {
      //           name: "Créditos de criação",
      //           value: "credits"
      //         },
      //         {
      //           name: "Estado das configurações",
      //           value: "stats"
      //         }
      //       ]
      //     }
      //   ]
      // }
    ]
  },
  additional: {
    category: "moderation",
    admin: false,
    staff: false,
    api_data: {
      name: "pearl",
      description: "[moderação] As pérolas devem ser mostradas para todos",
      category: "Moderação",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("pearl.name") || {}
          )
        )
      ),
      tags: ["new", "building"],
      perms: {
        user: [DiscordPermissons.ManageChannels, DiscordPermissons.ManageMessages],
        bot: [DiscordPermissons.ManageChannels, DiscordPermissons.ManageMessages]
      }
    },
    async execute(interaction: ChatInputCommandInteraction<"cached">) {

      const { options } = interaction;

      const subcommand = options.getSubcommand() as "config" | "status";

      if (subcommand === "config") return await configuration(interaction);
    }
  }
};