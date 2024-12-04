import { ButtonStyle, Message, parseEmoji } from "discord.js";
import { mapButtons } from "djs-protofy";
import { e } from "./json";

export default function loadingButton(customId: string, message: Message) {
  return mapButtons(message.components, button => {
    if (button.style === ButtonStyle.Premium || button.style === ButtonStyle.Link)
      return button;

    if (button.custom_id === customId) button.emoji = parseEmoji(e.Loading)!;
    button.disabled = true;
    return button;
  });
}