import { ChatInputCommandInteraction } from "discord.js";
import { QuizCharactersManager } from "../../../../../structures/quiz";
import modals from "../../../../../structures/modals";
import { status, creditsCharacters, profile } from "..";

export default async function options(interaction: ChatInputCommandInteraction) {

  const option = interaction.options.getString("function") as "transfer" | "points" | "backup" | "removeUserFromBlock" | "status" | "credits";

  if (option === "status") return await status(interaction);
  if (option === "points") return await profile(interaction, interaction.user);
  if (option === "transfer") return await QuizCharactersManager.setCharactersToDatabase(interaction);
  if (option === "backup") return await QuizCharactersManager.backup(interaction);
  if (option === "credits") return await creditsCharacters(interaction);
  if (option === "removeUserFromBlock") return await interaction.showModal(modals.charactersRemoveBlockedUser);
}