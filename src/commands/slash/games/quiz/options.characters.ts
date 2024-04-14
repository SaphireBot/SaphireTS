import { ChatInputCommandInteraction } from "discord.js";
import { QuizCharactersManager } from "../../../../structures/quiz";
import { e } from "../../../../util/json";
import modals from "../../../../structures/modals";
import status from "./status.characters";
import credits from "./credits.characters";

export default async function options(interaction: ChatInputCommandInteraction) {

  const option = interaction.options.getString("function") as "transfer" | "points" | "backup" | "removeUserFromBlock" | "status" | "credits";

  if (option === "status")
    return await status(interaction);

  if (option === "points")
    return await interaction.reply({ content: `${e.Loading} | NOT READY YET | Building...` });

  if (option === "transfer")
    return await QuizCharactersManager.setCharactersToDatabase(interaction);

  if (option === "backup")
    return await QuizCharactersManager.backup(interaction);

  if (option === "credits")
    return await credits(interaction);

  if (option === "removeUserFromBlock")
    return await interaction.showModal(
      modals.charactersRemoveBlockedUser
    );
}