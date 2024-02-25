import { AttachmentBuilder, Message, PermissionFlagsBits } from "discord.js";
import { Canvacord } from "canvacord";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { PermissionsTranslate } from "../../../util/constants";

export default {
  name: "delete",
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
  execute: async function (message: Message, _: string[]) {

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

    const image = await Canvacord.delete(avatar, true);
    return await msg.edit({ content: null, files: [new AttachmentBuilder(image)] });
  }
};