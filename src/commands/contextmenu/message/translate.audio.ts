import { ApplicationCommandType, AttachmentBuilder, MessageContextMenuCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { languages } from "../../prefix/util/translate/constants.translate";
import translate, { isSupported, speak } from "google-translate-api-x";

type langsKeyof = keyof typeof languages;
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
    name: "Translate BETA AUDIO",
    // name_localizations: getLocalizations("contextmenu.Translate"),
    // default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
    dm_permission: true,
    nsfw: false,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  },
  additional: {
    category: "util",
    admin: false,
    staff: false,
    api_data: {
      name: "Translate BETA AUDIO",
      description: "Traduza o conteúdo da mensagem rapidamente",
      category: "Utilidades",
      synonyms: [],
      tags: ["apps", "new"],
      perms: {
        user: [],
        bot: [],
      },
    },
    async execute(interaction: MessageContextMenuCommandInteraction<"cached">) {

      const { targetMessage: message, userLocale: locale } = interaction;
      const to = languages[locale as langsKeyof];

      if (!isSupported(to)) {
        return await interaction.reply({
          content: t("translate.not_supported_iso", { e, locale }),
          ephemeral: true,
        });
      }

      const text = message.content;

      if (!text?.length)
        return await interaction.reply({
          content: t("translate.no_args", { locale, e }),
          ephemeral: true,
        });


      if (text.length > 5000)
        return await interaction.reply({
          content: t("translate.over_limit", { e, locale }),
          ephemeral: true,
        });

      await interaction.reply({
        content: t("translate.translating", { e, locale }),
        ephemeral: true,
      });

      const res = await translate(text, { to, autoCorrect: true, forceBatch: false }).catch(() => null);
      if (!res) return await interaction.editReply({ content: "Fail." });
      const speakRes = await speak(res.text.slice(0, 200), { to, autoCorrect: true }).catch(() => { });
      if (!speakRes) return await interaction.editReply({ content: "Fail." });

      const attach = new AttachmentBuilder(
        Buffer.from(speakRes, "base64"),
        {
          name: "translate.audio.mp3",
          description: "Saphire Translate System",
        },
      );

      return await interaction.editReply({
        content: null,
        files: [attach],
      });

    },
  },
};