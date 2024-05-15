import { AutocompleteInteraction } from "discord.js";
import { ReminderType } from "../../../@types/commands";
import Database from "../../../database";
import { ReminderSchemaType } from "../../../database/schemas/reminder";
import Reminder from "../../reminder/reminder";
type remindersType = ReminderType | ReminderSchemaType | Reminder;
export const allRemindersToAutocomplete = new Map<string, Map<string, remindersType>>();
const timers: Record<string, NodeJS.Timeout> = {};

export async function setReminderToAutocompleteCache(userId: string, reminder: remindersType) {

  const map = allRemindersToAutocomplete.get(userId) || new Map<string, remindersType>();
  let reminders = Array.from(map.values());

  if (!reminders.length)
    reminders = await Database.Reminders.find({ userId });

  for (const rm of reminders)
    map.set(rm.id, rm);

  map.set(reminder.id, reminder);
  allRemindersToAutocomplete.set(userId, map);

  if (timers[userId]) clearTimeout(timers[userId]);
  timers[userId] = setTimeout(() => deleteAutocompleteCache(userId), 1000 * 30);
}

export function deleteAutocompleteCache(userId: string) {
  allRemindersToAutocomplete.delete(userId);
  clearTimeout(timers[userId]);
  delete timers[userId];
}

export default async function remindersAutocomplete(interaction: AutocompleteInteraction, value: string) {

  const { user } = interaction;
  const map = allRemindersToAutocomplete.get(user.id) || new Map<string, remindersType>();
  let reminders = Array.from(map.values());

  if (!reminders.length) {
    const data = await Database.Reminders.find({ userId: user.id });
    for (const rm of data) map.set(rm.id, rm);
    reminders = Array.from(map.values());
    if (reminders.length) setTimeout(() => deleteAutocompleteCache(user.id), 1000 * 30);
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