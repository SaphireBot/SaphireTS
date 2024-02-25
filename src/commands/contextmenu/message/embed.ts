import { ApplicationCommandType, AttachmentBuilder, MessageContextMenuCommandInteraction, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { DiscordPermissons, PermissionsTranslate } from "../../../util/constants";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
  data: {
    type: ApplicationCommandType.Message,
    application_id: client.user?.id,
    guild_id: "",
    name: "Embed to JSON",
    default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
    dm_permission: true,
  },
  additional: {
    category: "Util",
    admin: false,
    staff: false,
    api_data: {
      name: "Embed to JSON",
      description: "Transforme Embeds em JSON facilmente",
      category: "Utilidades",
      synonyms: [],
      tags: ["apps", "new"],
      perms: {
        user: [DiscordPermissons.ManageMessages],
        bot: [DiscordPermissons.AttachFiles]
      }
    },
    async execute(interaction: MessageContextMenuCommandInteraction<"cached">) {
      const { targetMessage: message, userLocale: locale, guild } = interaction;
      const embeds = message.embeds || [];

      if (guild && !guild.members.me!.permissions.has(PermissionFlagsBits.AttachFiles))
        return await interaction.reply({
          content: t("embed.no_attach_files_permission", { e, locale, perm: PermissionsTranslate.AttachFiles }),
          ephemeral: true
        });

      if (!embeds.length)
        return await interaction.reply({
          content: t("embed.no_embed_found", { e, locale }),
          ephemeral: true
        });

      const files = embeds.map(embed => {
        return new AttachmentBuilder(
          Buffer.from(
            JSON.stringify(embed.toJSON(), undefined, 2),
            "utf-8"
          ),
          { name: "embed.json" }
        );
      });

      return await interaction.reply({ files, ephemeral: true });
    }
  }
};