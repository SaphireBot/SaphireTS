import { ChatInputCommandInteraction } from "discord.js";
import { QuizCharactersManager } from "../../../../structures/quiz";
import { e } from "../../../../util/json";

export default async function options(interaction: ChatInputCommandInteraction) {

  const { options } = interaction;
  const option = options.getString("function") as "transfer" | "points";

  if (option === "transfer")
    return await QuizCharactersManager.setCharactersToDatabase(interaction);

  if (option === "points")
    return await interaction.reply({ content: `${e.Loading} | NOT READY YET | Building...` });
}