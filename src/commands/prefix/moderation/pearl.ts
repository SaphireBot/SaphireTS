import { Colors, Message } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import configuration from "../../functions/pearl/configuration.pearl";
import count from "../../functions/pearl/userCount.pearl";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { PearlsManager } from "../../../managers";
import Database from "../../../database";
import handler from "../../../structures/commands/handler";

const permissions = [DiscordPermissons.ManageChannels, DiscordPermissons.ManageMessages];
const aliases = [
  "perle",
  "pearl",
  "perla",
  "perle",
  "真珠",
  "pérola",
  "珍珠",
  "perlen",
  "pearls",
  "perlas",
  "pérolas",
  "zhēnzhū",
  "shinju",
  "perola"
];

const status = [
  "status",
  "estado",
  "statut",
  "状態",
  "状态",
  "punkte",
  "points",
  "puntos",
  "ポイント",
  "点数",
  "pontos",
  "Zählung",
  "count",
  "conteo",
  "comptage",
  "カウント",
  "计数",
  "contagem",
  "s", "c", "p"
];

export default {
  name: "pearl",
  description: "Pearls must be show to everybody",
  aliases,
  category: "moderation",
  api_data: {
    category: "Moderação",
    synonyms: aliases,
    tags: ["new", "building"],
    perms: {
      user: permissions,
      bot: permissions
    }
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    const { userLocale: locale, guildId, author, guild } = message;

    if (!args?.length) {
      const prefix = (await Database.getPrefix({ guildId, userId: author.id })).random()!;
      const cmd = t("pearl.pearl", locale);
      const slash = handler.getApplicationCommand("pearl")?.getMention("config");
      const data = PearlsManager.get(guildId);

      return await message.reply({
        embeds: [{
          color: Colors.Blue,
          title: t("pearl.embed.title", { e, locale }),
          description: t("pearl.embed.description", { e, locale }),
          fields: [
            {
              name: t("pearl.embed.fields.0.name", { e, locale }),
              value: permissions.map(perm => `${t(`Discord.Permissions.${perm}`, locale)}`).join(", ")
            },
            {
              name: t("pearl.embed.fields.1.name", { locale }),
              value: t("pearl.embed.fields.1.value", { e, locale, min: PearlsManager.min, max: PearlsManager.max })
            },
            {
              name: t("pearl.embed.fields.2.name", { locale }),
              value: t("pearl.embed.fields.2.value", { e, locale, prefix, cmd, slash })
            },
            {
              name: t("pearl.embed.fields.3.name", { locale }),
              value: data
                ? (() => {
                  let str = "";

                  str += `${data.emoji} ${t("pearl.reactions", { num: data.limit || 0, locale })}\n`;
                  str += `📨 ${guild.channels.cache.get(data.channelId)}\n`;
                  str += `⭐ ${t("pearl.total", {
                    total: Object.values(PearlsManager.count[guild.id] || {}).reduce((pre, curr) => pre + curr, 0).currency(),
                    locale
                  })}`;

                  return str;
                })()
                : `${e.DenyX} ${t("keyword_disable", locale)}`
            },
            {
              name: t("pearl.embed.fields.4.name", { e, locale }),
              value: t("pearl.embed.fields.4.value", { e, locale, prefix, cmd, slash, channel: guild.channels.cache.random()! })
            },
          ]
        }]
      });
    }

    if (status.includes(args?.[0]?.toLowerCase() || ""))
      return await count(message);

    return await configuration(message, args);

  }
};