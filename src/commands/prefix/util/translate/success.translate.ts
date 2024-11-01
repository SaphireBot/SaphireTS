import { APIEmbed, AttachmentBuilder, ChatInputCommandInteraction, Colors, Message, MessageContextMenuCommandInteraction, StringSelectMenuInteraction } from "discord.js";
import { googleTranslateApi, translate } from "google-translate-api-x";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import reply from "./reply.translate";
import { languages } from "./constants.translate";
import client from "../../../../saphire";

type langsKeys = keyof typeof languages;

export default async function successTranslate(
  res: googleTranslateApi.TranslationResponse,
  timeout: NodeJS.Timeout | undefined,
  msg: Message<true> | undefined,
  message: Message<true> | undefined,
  interaction?: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | StringSelectMenuInteraction,
) {

  const user = interaction ? interaction.user : message?.author;
  const locale = await user!.locale();

  const text = res.text;
  const isoFrom = res.from?.language?.iso || res.from;
  const isoTo = res.raw?.[1]?.[1] || (res as any)?.to;

  const footerText = `${languages[isoFrom as langsKeys] || isoFrom} to ${languages[isoTo as langsKeys] || isoTo} | Requested by ${user?.username}`;

  const footerTextTranslate = await translate(footerText, { to: languages[locale as langsKeys] })
    .then(res => res.text || footerText)
    .catch(() => footerText);

  if (!text?.length)
    return await reply({
      content: t("translate.no_text", { e, locale }),
    }, timeout, msg, message, interaction);

  if (text.length <= 1024) // Embed Field Value Limit Length
    return await reply({
      content: null,
      embeds: [
        {
          color: Colors.Blue,
          fields: [
            {
              name: t("translate.embed.textTranslated", { locale, e }),
              value: text.limit("EmbedFieldValue"),
            },
          ],
          footer: { text: footerTextTranslate },
        },
      ] as APIEmbed[],
    }, timeout, msg, message, interaction);

  if (text.length <= 2000) // Embed Description Value Limit Length -> Descrition limit is 4096
    return await reply({
      content: null,
      embeds: [
        {
          color: Colors.Blue,
          title: t("translate.embed.textTranslated", { locale, e }),
          description: text.limit("EmbedDescription"),
          fields: [],
          footer: { text: footerTextTranslate },
        },
      ] as APIEmbed[],
    }, timeout, msg, message, interaction);

  if (text.length < 5000) {

    let data = `${client.user?.username}'s Translate File System`;
    data += `\n \n${text}`;
    data += `\n \n${footerTextTranslate}`;

    const attachment = new AttachmentBuilder(
      Buffer.from(data),
      {
        name: "saphire-translate-system.txt",
        description: "Saphire Translate File Document",
      },
    );

    return await reply({
      content: null,
      embeds: [],
      components: [],
      files: [attachment],
    }, timeout, msg, message, interaction);
  }
}