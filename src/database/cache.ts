import { APIUser, Collection, GuildMember, User } from "discord.js";

export const users = new Collection<string, User | APIUser>();
export const members = new Collection<string, GuildMember>();