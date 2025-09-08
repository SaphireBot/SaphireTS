import { ApplicationCommandType, MessageContextMenuCommandInteraction, MessageFlags } from "discord.js";
import client from "../../../saphire";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { getLocalizations } from "../../../util/getlocalizations";
import { languages } from "../../prefix/util/translate/constants.translate";
import translate, { isSupported } from "google-translate-api-x";
import successTranslate from "../../prefix/util/translate/success.translate";

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
    name: "Translate Message",
    name_localizations: getLocalizations("contextmenu.Translate"),
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
      name: "Translate Message",
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
          flags: [MessageFlags.Ephemeral],
        });
      }

      const text = message.content;

      if (!text?.length)
        return await interaction.reply({
          content: t("translate.no_args", { locale, e }),
          flags: [MessageFlags.Ephemeral],
        });


      if (text.length > 5000)
        return await interaction.reply({
          content: t("translate.over_limit", { e, locale }),
          flags: [MessageFlags.Ephemeral],
        });

      await interaction.reply({
        content: t("translate.translating", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });

      return await translate(text, { to, autoCorrect: true, forceBatch: false })
        .then(async res => await successTranslate(res, undefined, undefined, undefined, interaction))
        .catch(async (err: Error) => {
          const content = t("translate.error", { locale, e, error: err?.message || err });
          return await interaction.editReply(content).catch(console.log);
        });
    },
  },
};