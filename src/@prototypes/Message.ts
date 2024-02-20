import { Message, LocaleString } from "discord.js";
import Database from "../database";
import { locales } from "./User";
import { Config } from "../util/constants";

Message.prototype.locale = async function (): Promise<any> {
    const locale = locales.get(this.author?.id);
    if (locale) return locale;

    const data = (await Database.getUser(this.author?.id))?.locale as LocaleString | undefined;

    if (typeof data === "string" && Config.locales.includes(data)) {
        locales.set(this.id, data);
        setTimeout(() => locales.delete(this.author?.id), 1000 * 60 * 10);
        return data;
    }

    if (Config.locales.includes(this.guild?.preferredLocale as string))
        return data;

    return data || "en-US";
};