import { AutocompleteInteraction } from "discord.js";
import { ReminderType } from "../../../@types/commands";
import Database from "../../../database";
const allReminders = new Map<string, ReminderType[]>();

export default async function remindersAutocomplete(interaction: AutocompleteInteraction, value: string) {

  const { user } = interaction;
  let reminders = allReminders.get(user.id) || [];

  if (!reminders.length) {
    const data = await Database.Reminders.find({ userId: user.id });
    allReminders.set(user.id, data.map(r => r.toObject()));
    reminders = allReminders.get(user.id) || [];
    if (reminders.length) setTimeout(() => allReminders.delete(user.id), 1000 * 30);
  }

  return await interaction.respond(
    reminders
      .filter(r => r.message?.toLowerCase().includes(value?.toLowerCase())
        || [r.channelId, r.guildId, r.id].includes(value))
      .slice(0, 25)
      .map(r => ({
        name: r.message.limit(100),
        value: r.id
      }))
  );
}