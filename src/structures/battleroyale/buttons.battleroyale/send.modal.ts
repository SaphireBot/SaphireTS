import { ButtonInteraction } from "discord.js";
import modals from "../../modals";

export default async function sendModalBattleroyaleList(
  interaction: ButtonInteraction<"cached">,
) {
  return await interaction.showModal(
    modals.sendPhraseToBattlaroyale(interaction.userLocale),
  );
}