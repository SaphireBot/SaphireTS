import { ApplicationCommandType, AttachmentBuilder, MessageContextMenuCommandInteraction, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { t } from "../../../translator";
import { e } from "../../../util/json";

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
    dm_permission: false,
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
        user: ["ManageMessages"],
        bot: []
      }
    },
    async execute(interaction: MessageContextMenuCommandInteraction<"cached">) {
      const { targetMessage: message, userLocale: locale } = interaction;
      const embeds = message.embeds || [];

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