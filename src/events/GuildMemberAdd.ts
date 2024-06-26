import { Events } from "discord.js";
import client from "../saphire";
import { AutoroleManager, BanManager } from "../managers";
// import Database from "../database";

client.on(Events.GuildMemberAdd, async (member) => {
    if (!member?.id) return;
    // Database.setCache(member.user.id, member.user.toJSON(), "user");
    await BanManager.delete(member.guild?.id, member?.id);
    AutoroleManager.addRoles(member.guild, member);
});

client.on(Events.GuildMemberAvailable, async (member) => {
    if (!member?.id) return;
    await BanManager.delete(member.guild?.id, member?.id);
    if (member.partial) member = await member.fetch();
});