import { AutocompleteInteraction } from "discord.js";
import { alphabet } from "../../stop/stop";
const alphabetMapped = alphabet.map(l => ({ name: l.toUpperCase(), value: l }));

export default async function remindersAutocomplete(interaction: AutocompleteInteraction, value: string) {

  if (alphabet.some(l => l === value?.toLowerCase()))
    return await interaction.respond([{ name: value.toUpperCase(), value }]);

  const v = value?.toLowerCase();
  return await interaction.respond(
    alphabetMapped
      .filter(l => l.value === v)
      .slice(0, 25)
  );

}