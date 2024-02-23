import { AttachmentBuilder, Message } from "discord.js";
import { Canvacord } from "canvacord";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default {
  name: "affect",
  description: "",
  aliases: [],
  category: "",
  api_data: {
    category: "",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message, _: string[] | undefined) {

    const msg = await message.reply({ content: t("images.loading", { e, locale: message.userLocale }) });

    const user = (await message.parseUserMentions()).first() || message.author;
    const avatar = user.displayAvatarURL({ extension: "png", forceStatic: true })
      || user.avatarURL({ extension: "png", forceStatic: true })
      || user.defaultAvatarURL;

    const image = await Canvacord.affect(avatar);
    return await msg.edit({ content:null, files: [new AttachmentBuilder(image)] });
  }
};