import { GuildMemberManager } from "discord.js";
const guildsFetched = new Set<string>();

GuildMemberManager.prototype.smartFetch = async function () {
  if (!guildsFetched.has(this.guild.id)) {
    await this.fetch().catch(() => { });
    guildsFetched.add(this.guild.id);
    setTimeout(() => guildsFetched.delete(this.guild.id), (1000 * 60) * 60);
  }
  return;
};