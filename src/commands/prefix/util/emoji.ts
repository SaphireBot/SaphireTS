import { ButtonStyle, Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { list as emojiList } from "../../functions/emojis";
const list = ["liste", "list", "lista", "リスト", "清单", "l"];

export default {
  name: "emoji",
  description: "Manage emojis easier",
  aliases: ["emojis"],
  category: "util",
  api_data: {
    category: "Utilidades",
    synonyms: ["emojis"],
    tags: ["new"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    const { userLocale: locale, author } = message;

    if (args?.[0]) {
      if (list.includes(args[0].toLowerCase()))
        return await emojiList(message);
    }

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
              disabled: false // !member?.permissions.has("ManageEmojisAndStickers")
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