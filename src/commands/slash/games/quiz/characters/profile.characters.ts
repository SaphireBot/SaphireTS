import { APIEmbed, ChatInputCommandInteraction, Colors, Message, User } from "discord.js";
import Database from "../../../../../database";
import { t } from "../../../../../translator";
import { e } from "../../../../../util/json";
import { GamingCount } from "../../../../../@types/database";

export default async function profile(
  interaction: ChatInputCommandInteraction | Message,
  user: User
) {

  const { userLocale: locale } = interaction;

  if (interaction instanceof ChatInputCommandInteraction)
    await interaction.deferReply();

  const data = await Database.getUser(user.id);
  const points = (data.GamingCount?.Characters || {}) as GamingCount["Characters"];

  let bar = "";
  let total = Number(points.total || 0);

  while (bar.length < 7) {
    bar += total > 200 ? "❇️" : "⬛";
    if (total >= 200) total -= 200;
  }

  const embed: APIEmbed = {
    color: Colors.Blue,
    title: t("quiz.characters.profile.title", { e, locale }),
    description: t("quiz.characters.profile.description", { e, locale }),
    thumbnail: { url: user.avatarURL()! },
    fields: [
      {
        name: t("quiz.characters.profile.fields.0", { e, locale }),
        value: `${(points.total || 0).currency()}`,
        inline: true
      },
      {
        name: t("quiz.characters.profile.fields.1", { e, locale }),
        value: `${(points.anime || 0).currency()}`,
        inline: true
      },
      {
        name: t("quiz.characters.profile.fields.2", { e, locale }),
        value: `${(points.animation || 0).currency()}`,
        inline: true
      },
      {
        name: t("quiz.characters.profile.fields.3", { e, locale }),
        value: `${(points.game || 0).currency()}`,
        inline: true
      },
      {
        name: t("quiz.characters.profile.fields.4", { e, locale }),
        value: `${(points.hq || 0).currency()}`,
        inline: true
      },
      {
        name: t("quiz.characters.profile.fields.5", { k: e.QuizCharacters["k-drama"], locale }),
        value: `${(points["k-drama"] || 0).currency()}`,
        inline: true
      },
      {
        name: t("quiz.characters.profile.fields.6", { e, locale }),
        value: `${(points.movie || 0).currency()}`,
        inline: true
      },
      {
        name: t("quiz.characters.profile.fields.7", { e, locale }),
        value: `${(points.serie || 0).currency()}`,
        inline: true
      },
      {
        name: t("quiz.characters.profile.fields.8", { e, locale }),
        value: bar,
        inline: true
      }
    ],
    footer: {
      text: `${user.username} - ${user.id}`
    }
  };

  return await reply({ content: null, embeds: [embed] });

  async function reply(data: { content: string | null, embeds?: APIEmbed[] }) {
    if (interaction instanceof Message) return await interaction.reply(data as any);
    return await interaction.editReply(data);
  }
}