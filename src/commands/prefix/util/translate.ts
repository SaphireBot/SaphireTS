import { Message } from "discord.js";
import { t } from "../../../translator";
import { translate, isSupported } from "google-translate-api-x";
import { e } from "../../../util/json";
import successTranslate from "./translate/success.translate";
import reply from "./translate/reply.translate";
import { languages } from "./translate/constants.translate";

const aliases = ["translate", "übersetzen", "traducir", "traduire", "翻訳する", "traduzir", "翻译", "tl"];
type langsKeyof = keyof typeof languages;

export default {
  name: "translate",
  description: "",
  aliases,
  category: "util",
  api_data: {
    category: "Utilidades",
    synonyms: aliases,
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    const { userLocale: locale } = message;

    const lang = args?.[0] as langsKeyof | undefined;

    if (languages[lang as langsKeyof] && args?.[0])
      args[0] = "";

    let text = args?.join(" ") || "";

    if (text.length > 5000)
      return await message?.reply({
        content: t("translate.over_limit", { e, locale }),
      });

    let replied = false;
    let msg: Message<true> | undefined = undefined;

    const timeout = setTimeout(async () => {

      if (replied) return;

      msg = await message.reply({
        content: t("translate.translating", { locale, e }),
      });

      if (!replied) replied = true;
    }, 3000);

    if (message.reference?.messageId && !text.length) {
      const referenceMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      const content = referenceMessage?.content;

      if (!content?.length)
        return await reply(
          {
            content: t("translate.no_reference_content", { e, locale }),
          },
          timeout, msg, message,
        );

      text = content;
    }

    if (!text?.length) {
      replied = true;
      return await reply({
        content: t("translate.no_args", { locale, e }),
      }, timeout, msg, message);
    }

    if (text.length > 5000) {
      replied = true;
      return await reply({
        content: t("translate.over_limit", { locale, e }),
      }, timeout, msg, message);
    }

    const to = languages[lang as langsKeyof] || languages[locale as langsKeyof] || locale;

    if (!isSupported(to)) {
      replied = true;
      return await reply({
        content: t("translate.not_supported_iso", { e, locale }),
      }, timeout, msg, message);
    }

    return await translate(text, {
      to,
      autoCorrect: true,
    })
      .then(async res => {
        replied = true;
        return await successTranslate(res, timeout, msg, message);
      })
      .catch(async (err: Error) => {
        replied = true;
        clearTimeout(timeout);
        const content = t("translate.error", { locale, e, error: err?.message || err });

        if (msg)
          await msg.edit(content).catch(console.log);
        else await message.reply(content);
      });
  },
};