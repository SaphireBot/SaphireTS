import { Message } from "discord.js";
import images from "../../functions/images/images";
const aliases = ["bilder", "imagens", "imagem", "img", "imágenes", "imagenes", "画像", "图片"]

export default {
  name: "images",
  description: "Search images from Google Images",
  aliases,
  category: "util",
  api_data: {
    category: "Utilidades",
    synonyms: aliases,
    tags: ["new"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async (message: Message<true>, args: string[] | undefined) => await images(message, args)
};