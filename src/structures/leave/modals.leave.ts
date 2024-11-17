import { ModalSubmitInteraction } from "discord.js";
import embedLeave from "./embed.leave";
import contentLeave from "./content.leave";
import embedLeaveLink from "./embedLink.leave";

export default async function modalsLeave(
  interaction: ModalSubmitInteraction<"cached">,
  customData: { c: "leave", src: "embed" | "content" | "embedLink" },
) {

  if (customData?.src === "embed") return await embedLeave(interaction);
  if (customData?.src === "content") return await contentLeave(interaction);
  if (customData?.src === "embedLink") return await embedLeaveLink(interaction);

}