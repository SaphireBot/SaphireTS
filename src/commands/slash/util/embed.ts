import { ApplicationCommandType, ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import payload from "../../functions/embed/payload";

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
    name: "embed",
    description: "Build an embed easy",
    description_localizations: getLocalizations("embed.description"),
    default_member_permissions: PermissionsBitField.Flags.ManageMessages.toString(),
    dm_permission: false,
    nsfw: false,
    options: [
    ]
  },
  additional: {
    category: "util",
    admin: false,
    staff: false,
    api_data: {
      name: "embed",
      description: "Crie embeds facilmente",
      category: "Utilidades",
      synonyms: [],
      tags: [],
      perms: {
        user: [],
        bot: []
      }
    },
    async execute(interaction: ChatInputCommandInteraction<"cached">) {

      const { guild, member, user } = interaction;

      if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

      return await interaction.reply(payload(interaction.userLocale, user.id));
    }
  }
};