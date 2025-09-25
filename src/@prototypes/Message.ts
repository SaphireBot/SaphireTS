import { Message, LocaleString, GuildMember, Collection, GatewayIntentBits } from "discord.js";
import Database from "../database";
import { locales } from "./User";
import { Config } from "../util/constants";
import client from "../saphire";

const ManyDiscordSnowflakesPattern = /\d{17,}/g;

Message.prototype.locale = async function (): Promise<any> {
    const locale = locales.get(this.author?.id);
    if (locale) return locale;

    const data: LocaleString | undefined = (await Database.getUser(this.author?.id))?.locale as LocaleString | undefined
        || (this.guild?.preferredLocale as LocaleString) as LocaleString | undefined;
    if (typeof data !== "string") return client.defaultLocale;

    if (Config.locales.includes(data)) {
        locales.set(this.id, data);
        setTimeout(() => locales.delete(this.author?.id), 1000 * 60 * 10);
        return data;
    }

    return data || client.defaultLocale;
};

Message.prototype.parseMemberMentions = async function (): Promise<Collection<string, GuildMember>> {
 if (!this.guild) return this.mentions.members ?? new Collection();

    if (this.client.options.intents.has(GatewayIntentBits.GuildMembers)) {
      // @ts-expect-error ts(2339)
      if (!this.guild._membersHasAlreadyBeenFetched) {
        await this.guild.members.fetch({ time: 10000 }).catch(() => null);
        // @ts-expect-error ts(2339)
        this.guild._membersHasAlreadyBeenFetched = true;
      }
    } else {
      const users = Array.from(new Set(this.content.match(ManyDiscordSnowflakesPattern)));

      if (users.length) {
        for (let i = 0; i < users.length;) {
          const user = users.slice(i, i += 100);
          // eslint-disable-next-line no-await-in-loop
          await this.guild.members.fetch({ user, time: 1000 }).catch(() => null);
        }
      }
    }

    const queries = new Set(this.content.trim().split(/\s+/g));

    for (const query of queries) {
      if (this.mentions.members!.has(query)) continue;

      const member = this.guild.members.searchBy(query);

      if (!member || this.mentions.members!.has(member.id)) continue;

      this.mentions.members!.set(member.id, member);
    }

    return this.mentions.members!;
}
