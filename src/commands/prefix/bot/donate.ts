import { Message } from "discord.js";
import { askForConfirmation } from "../../../structures/payment";
const aliases = [
  "spenden",
  "bezahlen",
  "donate",
  "pay",
  "donar",
  "pagar",
  "donar",
  "donner",
  "寄付する",
  "支払う",
  "捐赠"
];

export default {
  name: "donate",
  description: "Donate money to Saphire Project",
  aliases,
  category: "bot",
  api_data: {
    category: "Saphire",
    synonyms: aliases,
    tags: ["new"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async (message: Message<true>, _: string[] | undefined) => await askForConfirmation(message)
};