import { LocaleString, User } from "discord.js";
import Database from "../database";
export const locales = new Map<string, LocaleString>();

User.prototype.locale = async function () {
    const locale = locales.get(this.id);
    if (locale) return locale;

    let data = (await Database.getUser(this.id))?.locale as LocaleString | "pt" | undefined;
    if (data === "pt") data = "pt-BR";

    if (data) {
        locales.set(this.id, data);
        setTimeout(() => locales.delete(this.id), (1000 * 60) * 10);
    }

    return data;
};