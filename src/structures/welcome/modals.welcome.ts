import { ModalSubmitInteraction } from "discord.js";
import embedWelcome from "./embed.welcome";
import contentWelcome from "./content.welcome";
import embedWelcomeLink from "./embedLink.welcome";

export default async function modalsWelcome(
  interaction: ModalSubmitInteraction<"cached">,
  customData: { c: "welcome", src: "embed" | "content" | "embedLink" },
) {

  if (customData?.src === "embed") return await embedWelcome(interaction);
  if (customData?.src === "content") return await contentWelcome(interaction);
  if (customData?.src === "embedLink") return await embedWelcomeLink(interaction);

}