import { LocaleString, User } from "discord.js";
import Database from "../database";
export const languages = new Map<string, LocaleString>();

User.prototype.locale = async function () {
    const lang = languages.get(this.id);
    if (lang) return lang;

    const data = (await Database.getUser(this.id))?.locale as LocaleString | undefined;
    if (data) {
        languages.set(this.id, data);
        return data;
    }
    return "en-US";
};