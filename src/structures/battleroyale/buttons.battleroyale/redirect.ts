import { ButtonInteraction } from "discord.js";
import sendModalBattleroyaleList from "./send.modal";
import sendEphemeralMessageBattleroyaleList from "./list.buttons";
import battleroyaleMyPhrases from "./my_phrases";

export default async function battleroyaleList(
  interaction: ButtonInteraction<"cached">,
  data: {
    c: "battleroyale",
    src: "list" | "send" | "my_phrases"
  },
) {

  if (data.src === "list")
    return await sendEphemeralMessageBattleroyaleList(interaction);
  
  if (data.src === "send")
    return await sendModalBattleroyaleList(interaction);

  if (data.src === "my_phrases")
    return await battleroyaleMyPhrases(interaction);
}