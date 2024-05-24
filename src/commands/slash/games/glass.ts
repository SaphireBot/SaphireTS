import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, TextChannel } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import GlassesWar from "../../../structures/glass/GlassesWar";

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
    name: "glass",
    name_localizations: getLocalizations("glass.name"),
    description: "[game] A luck's game with strategy",
    description_localizations: getLocalizations("glass.description"),
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
        autocomplete: true
      }
    ]
  },
  additional: {
    category: "games",
    admin: false,
    staff: false,
    api_data: {
      name: "glass",
      description: "Um jogo de sorte e estratégia",
      category: "Jogos",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("glass.name") || {}
          )
        )
      ),
      tags: [],
      perms: {
        user: [],
        bot: []
      }
    },
    async execute(interaction: ChatInputCommandInteraction) {
      return new GlassesWar(
        {
          channelId: interaction.channelId,
          authorId: interaction.user.id,
          guildId: interaction.guildId
        },
        interaction,
        {
          author: interaction.user,
          channel: interaction.channel as TextChannel,
          guild: interaction.guild,
        }
      );
    }
  }
};