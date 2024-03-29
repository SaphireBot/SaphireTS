import { ButtonStyle, Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default {
  name: "emoji",
  description: "Manage emojis easier",
  aliases: [],
  category: "util",
  api_data: {
    category: "Utilidades",
    synonyms: [],
    tags: ["new"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {

    const { userLocale: locale, author } = message;

    return await message.reply({
      content: t("emojis.what_do_you_want", { e, locale }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("emojis.buttons.list", locale),
              custom_id: JSON.stringify({ c: "emojis", src: "list", uid: author.id }),
              emoji: e.Commands,
              style: ButtonStyle.Primary,
              disabled: true // !member?.permissions.has("ManageEmojisAndStickers")
            },
            {
              type: 2,
              label: t("emojis.buttons.steal", locale),
              custom_id: JSON.stringify({ c: "emojis", src: "steal", uid: author.id }),
              emoji: e.GunRight,
              style: ButtonStyle.Primary,
              disabled: true // !member?.permissions.has("ManageEmojisAndStickers")
            },
            {
              type: 2,
              label: t("emojis.buttons.create", locale),
              custom_id: JSON.stringify({ c: "emojis", src: "create", uid: author.id }),
              emoji: e.Gear,
              style: ButtonStyle.Primary,
              disabled: true // !member?.permissions.has("ManageEmojisAndStickers")
            },
            {
              type: 2,
              label: t("emojis.buttons.delete", locale),
              custom_id: JSON.stringify({ c: "emojis", src: "delete", uid: author.id }),
              emoji: e.Trash,
              style: ButtonStyle.Primary,
              disabled: true // !member?.permissions.has("ManageEmojisAndStickers")
            },
            {
              type: 2,
              label: t("emojis.buttons.cancel", locale),
              custom_id: JSON.stringify({ c: "emojis", src: "cancel", uid: author.id }),
              emoji: e.DenyX,
              style: ButtonStyle.Danger,
              disabled: true
            }
          ].asMessageComponents()
        }
      ]
    });

  }
};