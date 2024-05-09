import { ButtonInteraction } from "discord.js";
import alternative from "./altervative.pearl";

export default async function buttons(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "pearl", src: "emoji", uid: string }
) {
  
  if (customData.src === "emoji")
    return await alternative(interaction, customData?.uid);

}