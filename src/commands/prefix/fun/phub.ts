import { AttachmentBuilder, Message } from "discord.js";
import { Canvacord } from "canvacord";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default {
  name: "phub",
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
  execute: async function (message: Message, args: string[]) {

    if (!args?.length) return;

    const msg = await message.reply({ content: t("images.loading", { e, locale: message.userLocale }) });

    const user = (await message.parseUserMentions()).first() || message.author;
    const avatar = user.displayAvatarURL({ extension: "png", forceStatic: true })
      || user.avatarURL({ extension: "png", forceStatic: true })
      || user.defaultAvatarURL;

    const image = await Canvacord.phub({
      image: avatar,
      message: args?.slice(1).join(" "),
      username: user.username
    }).catch(() => null);

    if (!image)
      return msg.delete()?.catch(() => { });

    return await msg.edit({ content: null, files: [new AttachmentBuilder(image)] }).catch(() => { });
  }
};
