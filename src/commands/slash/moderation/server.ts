import { ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import serverStatus from "../../../structures/server/status.server";

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
    name: "server",
    name_localizations: getLocalizations("server.name"),
    description: "[moderation] A Server's Control Center",
    description_localizations: getLocalizations("server.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    // This is to enable DM Global commands
    // integration_types: [0, 1],
    // contexts: [0, 1, 2],
    options: [
    ],
  },
  additional: {
    category: "moderation",
    admin: false,
    staff: false,
    api_data: {
      name: "server",
      description: "Um centro de controle em um único comando",
      category: "Moderação",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("server.name") || {},
          ),
        ),
      ),
      tags: [],
      perms: {
        user: [DiscordPermissons.Administrator],
        bot: [DiscordPermissons.Administrator],
      },
    },
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => await serverStatus(interaction),
  },
};