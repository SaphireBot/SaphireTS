import { APIEmbed, ChatInputCommandInteraction, Colors, Message } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";
import { StaffsIDs } from "../../util/constants";

export default async function tictactoeCredits(
  interaction: ChatInputCommandInteraction<"cached"> | Message<true>,
) {

  const { userLocale: locale } = interaction;

  const users = await Promise.all([
    client.users.fetch(StaffsIDs.Rody), // Rody
    client.users.fetch("937855992392216586"), // othzin5
    client.users.fetch("1031368409071505478"), // ymisakiizz
    client.users.fetch("1150376617311486002"), // helder0971_35112
    client.users.fetch("565288760787468315"), // kzt_gabrielly
  ]);

  const embed: APIEmbed = {
    color: Colors.Blue,
    title: t("tictactoe.credits.title", { e, locale }),
    description: t("tictactoe.credits.description", { e, locale }),
    fields: [
      {
        name: t("tictactoe.credits.dev", { e, locale }),
        value: users[0].username || "❔",
      },
      {
        name: t("tictactoe.credits.testers", { e, locale }),
        value: users.slice(1, 5).map(u => u.username || "❔").join("\n"),
      },
    ],
  };

  const guild = await client.guilds.fetch("1312598459244875906").catch(() => null); // Poke Nexus;

  if (guild)
    embed.footer = {
      text: `❤️ Made in ${guild.name}`,
      icon_url: guild.iconURL()!,
    };

  return await interaction.reply({ embeds: [embed] });
}