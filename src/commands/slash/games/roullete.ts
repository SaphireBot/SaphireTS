import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { ChannelsInGame } from "../../../util/constants";
import { t } from "../../../translator";
import RussianRoulette from "../../../structures/roulette/roulette";

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
    name: "roulette",
    name_localizations: getLocalizations("roulette.name"),
    description: "A classic game, Russian Roulette",
    description_localizations: getLocalizations("roulette.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    // This is to enable DM Global commands
    // integration_types: [0, 1],
    // contexts: [0, 1, 2],
    options: [
      {
        name: "language",
        name_localizations: getLocalizations("setlang.options.0.name"),
        description: "Available languages to this command",
        description_localizations: getLocalizations("setlang.options.0.description"),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
      },
    ],
  },
  additional: {
    category: "games",
    admin: false,
    staff: false,
    api_data: {
      name: "roulette",
      description: "Roleta Russa, um clássico",
      category: "Diversão",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("roulette.name") || {},
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

      const { channelId, userLocale: locale } = interaction;
      if (ChannelsInGame.has(channelId))
        return await interaction.reply({
          content: t("lastclick.this_channels_is_in_game", { e, locale }),
        });

      ChannelsInGame.add(channelId);
      return await new RussianRoulette(interaction).chooseGameMode();
    },
  },
};