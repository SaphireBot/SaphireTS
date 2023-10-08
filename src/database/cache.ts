import { Collection, GuildMember, User } from "discord.js";

export const users = new Collection<string, User>();
export const members = new Collection<string, GuildMember>();