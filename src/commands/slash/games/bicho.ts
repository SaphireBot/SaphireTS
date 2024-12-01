import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import JogoDoBicho from "../../../structures/bicho/bicho";
import { ChannelsInGame } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";

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
    name: "bicho",
    name_localizations: getLocalizations("bicho.name"),
    description: "[games] A animal's game",
    description_localizations: getLocalizations("bicho.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    // This is to enable DM Global commands
    // integration_types: [0, 1],
    // contexts: [0, 1, 2],
    options: [
      {
        name: "amount",
        name_localizations: getLocalizations("pay.options.1.name"),
        description: "How much Sapphires do you want send?",
        description_localizations: getLocalizations("pay.options.1.description"),
        min_value: 1,
        type: ApplicationCommandOptionType.Integer,
        required: true,
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
      name: "bicho",
      description: "O famoso jogo do bicho",
      category: "Jogos",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("bicho.name") || {},
          ),
        ),
      ),
      tags: ["new", "building"],
      perms: {
        user: [],
        bot: [],
      },
    },
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => {

      if (ChannelsInGame.has(interaction.channelId))
        return await interaction.reply({
          content: t("lastclick.this_channels_is_in_game", { e, locale: interaction.userLocale }),
          ephemeral: true,
        });

      ChannelsInGame.add(interaction.channelId);
      return await new JogoDoBicho(interaction).lauch();
    },
  },
};