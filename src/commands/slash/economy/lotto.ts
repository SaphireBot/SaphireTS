import { ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import lottoPainel from "../../functions/lotto/painel.container";

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
    name: "lotto",
    // name_localizations: getLocalizations("lotto.name"),
    description: "[Economy] Choose a number and good luck!",
    description_localizations: getLocalizations("lotto.description"),
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
    category: "economy",
    admin: false,
    staff: false,
    api_data: {
      name: "lotto",
      description: "Adivinhe o número e ganhe sua quantia em dinheiro",
      category: "Economia",
      synonyms: [],
      tags: ["new"],
      perms: {
        user: [],
        bot: [],
      },
    },
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => await lottoPainel(interaction),
  },
};