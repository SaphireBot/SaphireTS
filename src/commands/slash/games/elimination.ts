import { ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import lauch from "../../functions/elimination/lauch";

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
    name: "elimination",
    name_localizations: getLocalizations("elimination.name"),
    description: "[game] Be the last one alive",
    description_localizations: getLocalizations("elimination.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    options: [],
  },
  additional: {
    category: "games",
    admin: false,
    staff: false,
    api_data: {
      name: "elimination",
      description: "Seja o último vivo",
      category: "Diversão",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("elimination.name") || {},
          ),
        ),
      ),
      tags: ["new"],
      perms: {
        user: [],
        bot: [],
      },
    },
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => await lauch(interaction),
  },
};