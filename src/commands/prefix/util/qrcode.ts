import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, ComponentType, ContainerBuilder, Message, parseEmoji, SectionBuilder } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";

const aliases = ["qr"];

export default {
  name: "qrcode",
  description: "Create an QrCode",
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
  execute: async function (message: Message, _: string[] | undefined) {

    const { userLocale: locale, author } = message;
    const data = await Database.Users.findOne({ id: author.id });

    const container = new ContainerBuilder({
      accent_color: Colors.Blue,
    })
      .addSectionComponents(
        new SectionBuilder({
          components: [
            {
              content: t("qrcode.what_is_it", { locale, e }),
              type: ComponentType.TextDisplay,
            },
          ],
          accessory: {
            type: ComponentType.Thumbnail,
            media: {
              url: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://saphire.one",
            },
          },
        }),
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>({
          components: [
            new ButtonBuilder({
              custom_id: JSON.stringify({ c: "qr", src: "create", uid: author.id }),
              emoji: parseEmoji(e.Reference)!,
              label: t("qrcode.create", { locale, codes: data?.QrCode?.length || 0 }),
              style: ButtonStyle.Success,
              disabled: (data?.QrCode?.length || 0) >= 10,
            }),
            new ButtonBuilder({
              custom_id: JSON.stringify({ c: "qr", src: "view", uid: author.id }),
              emoji: parseEmoji(e.Database)!,
              label: t("qrcode.my_qr", locale),
              style: ButtonStyle.Primary,
              disabled: (data?.QrCode?.length || 0) <= 0,
            }),
            new ButtonBuilder({
              custom_id: JSON.stringify({ c: "delete", uid: author.id }),
              emoji: parseEmoji(e.Trash)!,
              label: t("keyword_cancel", locale),
              style: ButtonStyle.Danger,
            }),
          ],
        }),
      );

    return await message.reply({ flags: ["IsComponentsV2"], components: [container] });

  },
};