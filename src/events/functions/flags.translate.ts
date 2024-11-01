import { ComponentType, Message, MessageReaction, parseEmoji, PartialUser, User } from "discord.js";
import { flagsCountryName, languages, languagesWithFlags } from "../../commands/prefix/util/translate/constants.translate";
import translate from "google-translate-api-x";
import { t } from "../../translator";
import { e } from "../../util/json";
import successTranslate from "../../commands/prefix/util/translate/success.translate";
type langsFlagsKeyof = keyof typeof languagesWithFlags;
type langsKeys = keyof typeof languages;

const cache = new Set<string>();

export default async function translateByReaction(reaction: MessageReaction, user: User | PartialUser) {

  const { emoji, message } = reaction;

  if (!message.content) {
    if (message.partial) await message.fetch().catch(() => { });
    if (!message.content?.length) return;
  }

  const content = message.content;
  const emojiString = emoji.toString();

  if (cache.has(message.id)) return;
  cache.add(message.id);
  setTimeout(() => cache.delete(message.id), 1000 * 7);

  if (user.partial) await user.fetch().catch(() => null);

  const locale = await user.locale();
  const lang = languagesWithFlags[emojiString as langsFlagsKeyof];

  if (Array.isArray(lang)) {
    if (!lang.some(l => languages[l as langsKeys])) return;
  } else if (!languages[lang as langsKeys]) return;

  const countryName = flagsCountryName[emojiString as keyof typeof flagsCountryName];
  let countryNameTranslate: string;

  if (locale === "pt-BR") countryNameTranslate = countryName;
  else countryNameTranslate = (await translate(countryName, { to: languages[locale as langsKeys] }))?.text || emojiString;

  if (Array.isArray(lang)) {

    const langs = await translate(
      lang.map(l => languages[l as langsKeys] || "?"),
      { to: languages[locale as langsKeys] },
    )
      .catch(async err => {
        console.log(err);
        reaction.remove().catch(() => { });
        return null;
      });

    if (!langs) return;
    const msg = await message.reply({
      content: t("translate.too_many_langs", { e, locale, countryName: countryNameTranslate, flag: emoji }),
      components: [
        {
          type: 1,
          components: [{
            type: 3,
            custom_id: "translateMenuChoosen",
            placeholder: t("translate.choose_a_lang", locale),
            options: lang.map((l, i) => ({
              label: `[${l}] ${langs[i]?.text || "?"}`,
              emoji: parseEmoji(emojiString),
              value: l,
            })).slice(0, 25),
          }] as any[],
        },
      ],
    }).catch(() => null);

    if (!msg) return;

    return msg.createMessageComponentCollector({
      filter: int => int.user.id === user.id,
      time: 1000 * 60,
      componentType: ComponentType.StringSelect,
      max: 1,
    })
      .on("collect", async int => {

        const value = int.values[0];

        if (!languages[value as langsKeys])
          return await msg.delete().catch(() => { });

        await msg.delete().catch(() => { });
        await int.deferReply();
        const res = await translate(content, { to: value, rejectOnPartialFail: false, forceBatch: false }).catch(() => null);

        if (!res)
          return await int.editReply({
            content: t("translate.no_text", { locale, e }),
            components: [],
          });

        return await successTranslate(res, undefined, undefined, undefined, int);
      })
      .on("end", async (_, reason) => {
        if (reason === "time") return await msg.delete().catch(() => { });
      });

  } else {
    const res = await translate(content, { to: languages[lang as langsKeys], rejectOnPartialFail: false, forceBatch: false }).catch(() => null);
    if (!res) return await message.reply({ content: t("translate.no_text", { locale, e }) });
    return await successTranslate(res, undefined, undefined, message as Message<true>);
  }
}