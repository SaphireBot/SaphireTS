import { Message } from "discord.js";
import { Ship } from "canvafy";
import { e } from "../../../util/json";
import { t } from "../../../translator";

const ships: Record<string, number> = {};

export default {
  name: "ship",
  description: "",
  aliases: [],
  category: "",
  api_data: {
    category: "",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message, _: string[] | undefined) {
    
    const { userLocale: locale } = message;
    const members = await message.parseUserMentions();

    if (members.size <= 1)
      return await message.reply({
        content: `${e.Animated.SaphireReading} | Você precisa me dizer pelo menos 2 pessoas para eu calcular o ship`,
      });

    const msg = await message.reply({ content: t("experience.loading", { e, locale }) });
    const userOne = members.first()!;
    const userTwo = members.last()!;

    let num = ships[`${userOne.id}` + `${userTwo.id}`] || ships[`${userTwo.id}` + `${userOne.id}`];

    if (!num) {
      ships[`${userOne.id}` + `${userTwo.id}`] = Math.floor(Math.random() * 100) + 1;
      num = ships[`${userOne.id}` + `${userTwo.id}`];
    }

    if (num > 100) num = 100;
    if (num <= 0) num = 1;

    const file = {
      attachment: await new Ship()
        .setAvatars(members.first()!.displayAvatarURL({ extension: "png" }), members.last()!.displayAvatarURL({ extension: "png" }))
        .setBackground("image", "https://images.pexels.com/photos/776635/pexels-photo-776635.jpeg")
        .setBorder("#f0f0f0")
        .setOverlayOpacity(0.5)
        .setCustomNumber(num)
        .build(),
      name: `ship-${message.author.id}.png`,
    };

    return await msg.edit({ content: null, files: [file] })
      .catch(async () => await message.reply({ content: undefined, files: [file] }).catch(() => { }));

  },
};