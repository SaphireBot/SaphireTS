import { LocaleString } from "discord.js";

Array.prototype.asMessageComponents = function () {
    return this;
};

Array.prototype.format = function (locale: LocaleString = "en-US"): string {
    const formatter = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
    return formatter.format(this);
};