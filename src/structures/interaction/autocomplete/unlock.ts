import { AutocompleteInteraction, NonThreadGuildBasedChannel } from "discord.js";
import client from "../../../saphire";

export default async function unlockChannelCommands(interaction: AutocompleteInteraction<"cached">, value: string) {

  const { guild, guildId } = interaction;
  const guildChannels = await guild?.channels.fetch()?.catch(() => null);
  if (!guildChannels || !guildChannels.size) return await interaction.respond([]);

  const channelsBlocked = client.channelsCommandBlock[guildId] || new Set();
  const channels = Array.from(channelsBlocked).map(id => guildChannels.get(id)).filter(Boolean) as NonThreadGuildBasedChannel[];

  const response = channels
    .filter(ch => ch.name.includes(value) || ch.id.includes(value))
    .map(ch => ({ name: `# ${ch.name}`, value: ch.id }))
    .slice(0, 25);

  return await interaction.respond(response);
}