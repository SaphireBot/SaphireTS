import { Message } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import serverStatus from "../../../structures/server/status.server";

const aliases = [
  "serveur",
  "サーバー",
  "servidor",
  "服务器",
  "Kontrolle",
  "control",
  "contrôle",
  "コントロール",
  "controle",
  "控制", ,
  "panel",
  "panneau",
  "パネル",
  "painel",
  "面板",
  "zentral",
  "central",
  "中央",
];

export default {
  name: "server",
  description: "Um centro de controle em um único comando",
  aliases,
  category: "moderation",
  api_data: {
    category: "Moderação",
    synonyms: aliases,
    tags: ["new", "building"],
    perms: {
      user: [DiscordPermissons.Administrator],
      bot: [DiscordPermissons.Administrator],
    },
  },
  execute: async (message: Message<true>) => await serverStatus(message),
};