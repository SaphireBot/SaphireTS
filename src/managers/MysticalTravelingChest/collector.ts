import { ComponentType, Message } from "discord.js";
import { MysticalTravelingChestManager } from "..";
import { chestCatchedPayload, chestFinalPayload } from "./message.payload";
import client from "../../saphire";

export default function enableMysticalChestCollector(message: Message<boolean> | null) {

  if (!message) return;

  const collector = message.createMessageComponentCollector({
    filter: interaction => interaction.customId == "catch",
    time: 1000 * 60,
    max: 1,
    componentType: ComponentType.Button,
  });

  collector.on("collect", async interaction => {
    if (interaction.customId !== "catch") return;

    const prize = MysticalTravelingChestManager.prize;
    MysticalTravelingChestManager.setPrize(interaction.user.id, prize.coins, prize.exp);

    return await interaction.update(chestCatchedPayload(interaction.user, interaction.guild?.preferredLocale || client.defaultLocale, prize)).catch(() => { });

  });

  collector.on("end", async (_, reason) => {

    if (["time", "idle"].includes(reason))
      return await message.edit(chestFinalPayload(message.guild?.preferredLocale || client.defaultLocale)).catch(() => { });

    return;

  });
}