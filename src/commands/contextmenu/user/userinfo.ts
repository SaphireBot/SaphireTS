import { ApplicationCommandType, UserContextMenuCommandInteraction } from "discord.js";
import client from "../../../saphire";
import handler from "../../../structures/commands/handler";
import { getLocalizations } from "../../../util/getlocalizations";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
  data: {
    type: ApplicationCommandType.User,
    application_id: client.user?.id,
    guild_id: "",
    name: "User Info",
    name_localizations: getLocalizations("contextmenu.UserInfo"),
    default_member_permissions: undefined,
    dm_permission: true,
    nsfw: false
  },
  additional: {
    category: "Util",
    admin: false,
    staff: false,
    api_data: {
      name: "User Info",
      description: "Veja informações sobre um usuário",
      category: "Utilidades",
      synonyms: [],
      tags: ["apps", "new"],
      perms: {
        user: [],
        bot: []
      }
    },
    async execute(interaction: UserContextMenuCommandInteraction) {
      const command = handler.getSlashCommand("userinfo");
      if (!command)
        return await interaction.reply({
          content: "COMMAND_NOT_FOUND.CONTEXT_REPLY#2125",
          ephemeral: true
        });
      return await command.additional.execute(interaction as any);
    }
  }
};