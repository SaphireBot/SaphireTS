import { APIEmbed, Collection, Colors, GuildMember, User } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { urls } from "../../../../util/constants";

export default async function embedAvatarBuild(
  users: Collection<string, User>,
  members: Collection<string, GuildMember>,
  guildId: string,
  locale: string
): Promise<Collection<string, { decompiler: APIEmbed[], compiler: APIEmbed[] }>> {

  const embeds = new Collection<string, { decompiler: APIEmbed[], compiler: APIEmbed[] }>();

  for await (const user of users.values()) {

    const embed = {
      decompiler: [] as APIEmbed[],
      compiler: [] as APIEmbed[],
    };

    if ("fetch" in user && !user?.banner)
      await user.fetch();

    const member = members.get(user.id);
    const defaultAvatarURL = user.defaultAvatarURL;
    const userAvatarURL = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar?.includes("a_") ? "gif" : "png"}?size=2048` : null;
    const memberAvatarURL = member?.avatar ? `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${member.avatar}.${member.avatar?.includes("a_") ? "gif" : "png"}?size=2048` : null;
    const bannerUrl = user.banner ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner?.includes("a_") ? "gif" : "png"}?size=2048` : null;

    if (
      !userAvatarURL
      && !memberAvatarURL
      && !bannerUrl
      && !defaultAvatarURL
    ) {
      const noUser = {
        color: Colors.Blue,
        description: t("avatar.no_image_found", { e, locale }),
        image: { url: urls.not_found_image }
      };
      embed.decompiler.push(noUser);
      embed.compiler.push(noUser);
      embeds.set(user.id, embed);
      continue;
    }

    if (defaultAvatarURL) {
      embed.compiler.push({
        color: Colors.Blue,
        url: defaultAvatarURL,
        description: t("avatar.compiler_mode", { locale, user }),
        image: { url: defaultAvatarURL }
      });
      embed.decompiler.push({
        color: Colors.Blue,
        description: t("avatar.defaultAvatarURL", { locale, user }),
        image: { url: defaultAvatarURL }
      });
    }

    if (userAvatarURL) {
      embed.compiler.push({
        url: defaultAvatarURL,
        image: { url: userAvatarURL }
      });
      embed.decompiler.push({
        color: Colors.Blue,
        description: t("avatar.user_url", { locale, e, userAvatarURL, user }),
        image: { url: userAvatarURL }
      });
    }

    if (memberAvatarURL) {
      embed.compiler.push({
        url: defaultAvatarURL,
        image: { url: memberAvatarURL }
      });
      embed.decompiler.push({
        color: Colors.Blue,
        description: t("avatar.member_url", { locale, e, memberAvatarURL, member }),
        image: { url: memberAvatarURL }
      });
    }

    if (bannerUrl) {
      embed.compiler.push({
        url: defaultAvatarURL,
        image: { url: bannerUrl }
      });
      embed.decompiler.push({
        color: Colors.Blue,
        description: t("avatar.banner_url", { locale, e, bannerUrl, user }),
        image: { url: bannerUrl }
      });
    }

    embeds.set(user.id, embed);
    continue;
  }

  return embeds;
}