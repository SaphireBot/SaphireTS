import { Message } from "discord.js";
import Database from "../database";
import { locales } from "./User";
import { Config, LocaleString } from "../util/constants";
import client from "../saphire";

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
