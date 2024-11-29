import { ChannelSelectMenuInteraction, StringSelectMenuInteraction } from "discord.js";
import switchControl from "./switch.control";
import refreshServer from "../../structures/server/refresh.server";
import logSystemServer from "../../structures/server/logsystem.server";
import setChannelMessages from "./setchannel.control";

export default async function interactionsMessagesControl(
  interaction: StringSelectMenuInteraction<"cached"> | ChannelSelectMenuInteraction<"cached">,
) {

  const values = interaction.values as ("messageUpdate" | "messageDelete" | "messageDeleteBulk" | "messageReactionRemoveAll" | "messageReactionRemoveEmoji" | "channelId" | "active" | "refresh" | "logsystem" | "remove_channel")[];
  
  if (interaction instanceof ChannelSelectMenuInteraction) return await setChannelMessages(interaction);
  if (values.includes("refresh")) return await refreshServer(interaction);
  if (values.includes("logsystem")) return await logSystemServer(interaction);

  return await switchControl(interaction, values as any[]);

}