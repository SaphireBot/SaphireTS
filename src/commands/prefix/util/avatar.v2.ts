import { ButtonInteraction, Message, StringSelectMenuInteraction, TextDisplayBuilder, UserSelectMenuInteraction } from "discord.js";
import payloadAvatarBuild from "./avatar/payload.build";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
const aliases = ["pfp", "icon", "picture", "icone", "ícone"];

export default {
  name: "avatar",
  description: "[util] See the user's avatar. From everywhere/everyone.",
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

    const { author, guild } = message;
    let locale = message.userLocale;
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

    const msg = await message.reply({
      flags: ["IsComponentsV2"],
      components: [
        new TextDisplayBuilder({
          content: `${e.Loading} | ${t("avatar.select_menu_placeholder", { locale, users: { length: users.size } })}...`,
        }),
      ],
    });

    let payload = await payloadAvatarBuild(users, members, message.guildId, locale, author.id);
    if (users.size > 5) await sleep(1500);

    await msg.edit({
      flags: ["IsComponentsV2"],
      components: [
        payload.first()!,
      ],
    });

    let lastIndexUsed = 0;
    return msg.createMessageComponentCollector({
      filter: int => int.user.id === author.id,
      idle: 1000 * 60 * 4,
    })
      .on("collect", async (int: StringSelectMenuInteraction<"cached"> | UserSelectMenuInteraction<"cached"> | ButtonInteraction<"cached">): Promise<any> => {

        const { userLocale, customId } = int;
        locale = userLocale;

        if (int instanceof StringSelectMenuInteraction) {

          let container = payload.get(int.values[0]);
          if (!container) container = payload.get("no");

          lastIndexUsed = payload.keysToArray().findIndex(id => id === (int.values[0] || "no")) - 1 || payload.size - 1;
          return await int.update({ flags: ["IsComponentsV2"], components: [container!] }).catch(() => { });
        }

        if (int instanceof ButtonInteraction) {

          if (customId === "delete") return await int.message.delete().catch(() => { });
          if (customId === "zero") lastIndexUsed = 0;
          if (customId === "last") lastIndexUsed = payload.size - 2;
          if (customId === "left") lastIndexUsed--;
          if (customId === "right") lastIndexUsed++;

          if (lastIndexUsed >= payload.size - 1) lastIndexUsed = 0;
          if (lastIndexUsed < 0) lastIndexUsed = payload.size - 2;
          const data = payload.at(lastIndexUsed);

          if (data) return await int.update({ flags: ["IsComponentsV2"], components: [data] }).catch(() => { });
          else return await int.update({ flags: ["IsComponentsV2"], components: [payload.get("no")!] }).catch(() => { });

        }

        if (int instanceof UserSelectMenuInteraction) {

          const id = int.values[0];

          if (payload.has(id)) {
            lastIndexUsed = (payload.keysToArray().findIndex(i => i === id) - 1) || payload.size - 1;
            return await int.update({ flags: ["IsComponentsV2"], components: [payload.get(id)!] }).catch(() => { });
          }

          const user = await client.users?.fetch(id).catch(() => null);
          if (!user) return await int.deferUpdate({});

          users.set(user.id, user);
          const member = await guild.members.fetch(user.id).catch(() => null);
          if (member) members.set(member.id, member);

          payload = await payloadAvatarBuild(users, members, message.guildId, locale, author.id);
          lastIndexUsed = payload.size - 2;
          return await int.update({ flags: ["IsComponentsV2"], components: [payload.get(id)!] }).catch(() => { });
        }

      });
    // .on("end", async (): Promise<any> => await msg.edit({ components: [] }).catch(() => { }));
  },
};