import { AttachmentBuilder, Message, PermissionFlagsBits } from "discord.js";
import { Canvacord } from "canvacord";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { PermissionsTranslate } from "../../../util/constants";

export default {
  name: "phub",
  description: "A example of a phub comment",
  aliases: [],
  category: "fun",
  api_data: {
    category: "Diversão",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message, args: string[]) {

    if (!args?.length) return;

    const { guild, userLocale: locale } = message;

    if (guild && !guild.members.me!.permissions.has(PermissionFlagsBits.AttachFiles))
      return await message.reply({
        content: t("embed.no_attach_files_permission", { e, locale, perm: PermissionsTranslate.AttachFiles })
      });

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
