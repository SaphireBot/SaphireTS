import { type Snowflake } from "discord.js";

export const discordIdPattern = /^\d{15,}$/;

export function isDiscordId<T extends Snowflake>(value: T): value is T
export function isDiscordId(value: unknown): value is Snowflake
export function isDiscordId(value: unknown) {
  return typeof value === "string" && discordIdPattern.test(value);
}