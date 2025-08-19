import { Message, ChatInputCommandInteraction } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";

export default async function tictactoeStatus(
  interaction: ChatInputCommandInteraction<"cached"> | Message<true>,
) {

  const { userLocale: locale } = interaction;

  let userId = "";

  if (interaction instanceof ChatInputCommandInteraction) {
    userId = interaction.options.getUser("status")?.id || interaction.user.id;
    const data = await Database.getUser(userId);
    const key = userId === interaction.user.id ? "tictactoe.status_you" : "tictactoe.status_another";
    return await interaction.reply({
      content: t(key, {
        e,
        locale,
        wins: (data.Jokempo?.Wins || 0).currency(),
        loses: (data.Jokempo?.Loses || 0).currency(),
        draws: (data.Jokempo?.Draws || 0).currency(),
      }),
    });
  }

  if (interaction instanceof Message) {

    if (interaction.partial) await interaction.fetch().catch(() => { });
    const mentions = await interaction.parseUserMentions();
    mentions.set(interaction.author.id, interaction.author);
    const msg = await interaction.reply({
      content: `${e.Loading} | ${t("keyword_loading", locale)}`,
    });
    const data = await Database.getUsers(mentions.keysToArray().slice(0, 50));
    let content = "";

    for (const d of data) {
      const key = d.id === interaction.author.id ? "tictactoe.status_you" : "tictactoe.status_another";
      content += `${t(key, {
        e,
        locale,
        wins: (d.Jokempo?.Wins || 0).currency(),
        loses: (d.Jokempo?.Loses || 0).currency(),
        draws: (d.Jokempo?.Draws || 0).currency(),
        username: mentions.get(d.id)?.username || "❔",
      })}\n`;
    }

    return msg.edit({
      content: content.limit("MessageContent"),
    }).catch(() => { });
  }

}