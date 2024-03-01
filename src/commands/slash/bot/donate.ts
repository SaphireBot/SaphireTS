import { ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { askForConfirmation } from "../../../structures/payment";

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
    name: "donate",
    name_localizations: getLocalizations("donate.name"),
    description: "Donate money to Saphire Project",
    description_localizations: getLocalizations("donate.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    options: []
  },
  additional: {
    category: "bot",
    admin: false,
    staff: false,
    api_data: {
      name: "donate",
      description: "Doe dinheirinhos para o Projeto Saphire",
      category: "Saphire",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("donate.name") || {}
          )
        )
      ),
      tags: ["new"],
      perms: {
        user: [],
        bot: []
      }
    },
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => await askForConfirmation(interaction)
  }
};