import { Message, PermissionFlagsBits } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";

export default {
  name: "teams",
  description: "Forme times facilmente",
  aliases: ["team", "time", "times"],
  category: "util",
  api_data: {
    category: "Utilidades",
    synonyms: ["team", "time", "times"],
    tags: ["new"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {

    const { userLocale: locale, guild, author, member } = message;

    if (!member?.permissions.has(PermissionFlagsBits.ManageRoles, true))
      return await permissionsMissing(message, [DiscordPermissons.ManageRoles], "Discord_you_need_some_permissions");

    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles, true))
      return await permissionsMissing(message, [DiscordPermissons.ManageRoles], "Discord_client_need_some_permissions");

    return await message.reply({
      content: t("teams.awaiting_roles", { e, locale }),
      components: [{
        type: 1,
        components: [
          {
            type: 6,
            custom_id: JSON.stringify({ c: "teams", id: author.id }),
            placeholder: t("teams.components.select_menu.awaiting_roles_placeholder", locale),
            min_values: 2,
            max_values: 25,
          },
        ],
      }],
    });

  },
};