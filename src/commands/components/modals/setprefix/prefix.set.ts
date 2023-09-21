import { ModalSubmitInteraction } from "discord.js";

export default async function setPrefixes(interaction: ModalSubmitInteraction) {
    console.log(interaction.user.id, "Modal Submit Ok");
}