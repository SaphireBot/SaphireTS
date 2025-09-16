import { Message } from "discord.js";
import { Instagram } from "canvafy";

export default {
  name: "instagram",
  description: "Build an image like Instagram",
  aliases: ["insta", "ig"],
  category: "fun",
  api_data: {
    category: "Diversação",
    synonyms: ["insta", "ig"],
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {

    const { author } = message;

    const instagram = new Instagram();

    const avatarURL = author.avatarURL();

    if (!avatarURL)
      return await message.reply({ content: "no image" });

    const image = await instagram.setAvatar(avatarURL)
      .setPostImage(avatarURL)
      .setLike({ count: 1200, likeText: "curtidas" })
      .setUser({ username: author.username })
      .setTheme("dark")
      .setLiked(true)
      .setVerified(true)
      .setStory(true)
      .setSaved(true)
      .setPostDate(new Date().getTime())
      .build();
    
    return await message.reply({
      files: [{
        attachment: image,
        name: "instagram_command.png",
      }],
    });
  },
};