import { User } from "discord.js";
import Database from "../database";
import { Config, LocaleString } from "../util/constants";
import client from "../saphire";
export const locales = new Map<string, LocaleString>();

User.prototype.locale = async function (): Promise<LocaleString | undefined> {
    const locale = locales.get(this.id);
    if (locale) return locale as LocaleString;

    const data = (await Database.getUser(this.id))?.locale as LocaleString;
    if (!Config.locales.includes(data)) return client.defaultLocale as LocaleString;

    locales.set(this.id, data);
    setTimeout(() => locales.delete(this.id), 1000 * 60 * 10);
    return data as LocaleString;
};