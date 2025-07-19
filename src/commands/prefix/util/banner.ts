import { Colors, Message, StringSelectMenuInteraction, APIEmbed, Collection, User } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { avatarSelectMenu } from "../../components/buttons/buttons.get";
import { urls } from "../../../util/constants";
const aliases = [] as string[];

export default {
  name: "banner",
  description: "[util] See the user's banner. From everywhere/everyone.",
  aliases,
  category: "util",
  api_data: {
    category: "Utilidades",
    synonyms: aliases,
    tags: [],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    let locale = message.userLocale;
    const author = message.author;

    const users = await message.parseUserMentions();
    const members = await message.parseMemberMentions();

    if (members.size > users.size)
      for (const [memberId, member] of members)
        if (!users.has(memberId))
          users.set(memberId, member.user);

    if (users?.size > 25) {
      let i = 0;
      for (const [userId] of users) {
        i++;
        if (i > 25) users.delete(userId);
      }
    }

    if (members?.size > 25) {
      let i = 0;
      for (const [memberId] of members) {
        i++;
        if (i > 25) members.delete(memberId);
      }
    }

    if (!users?.size && !args?.length) {
      users.set(message.author.id, message.author);
      if (message.member) members.set(message.author.id, message.member);
    }

    const embeds = new Collection() as Collection<string, APIEmbed>;

    for await (let user of users.values()) {
      if (user.partial || !user.banner) {
        user = await user.fetch().catch(() => undefined) as User;
        if (!user) continue;
        users.set(user.id, user);
      }
      const url = user.bannerURL({ size: 2048 });
      if (!url) continue;
      embeds.set(
        user.id,
        {
          color: Colors.Blue,
          description: `🖼️ Banner - ${user.username}`,
          image: { url },
        },
      );
    }

    if (!embeds.size)
      return await message.reply({
        content: t("avatar.nobody_found", { e, locale }),
      });

    function selectMenu() {
      return embeds.size > 1
        ? avatarSelectMenu(
          "menu",
          t("avatar.select_menu_placeholder", { locale, users: { length: users.size } }),
          users
            .map((u, id) => ({
              value: id as string,
              label: u.displayName,
              emoji: u.bot ? e.Bot : "👤",
            })),
        )
        : [];
    }

    const components = selectMenu();

    const msg = await message.reply({
      embeds: [embeds.first()!],
      components,
    });

    let lastId = embeds.firstKey()!;
    return msg.createMessageComponentCollector({
      filter: int => int.user.id === author.id,
      idle: 1000 * 60 * 4,
    })
      .on("collect", async (int: StringSelectMenuInteraction<"cached">): Promise<any> => {
        locale = int.userLocale;
        lastId = int.values[0];

        return await int.update({
          embeds: [
            embeds.get(lastId)
            || {
              color: Colors.Blue,
              description: t("avatar.no_image_found", { e, locale }),
              image: { url: urls.not_found_image },
            },
          ],
        });

      })
      .on("end", async (): Promise<any> => await msg.edit({ components: [] }).catch(() => { }));

  },
};