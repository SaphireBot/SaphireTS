import { LocaleString, TimestampStylesString, time } from "discord.js";
import { t } from "../translator";

Date.stringDate = (ms = 0, withMilliseconds = false, locale: LocaleString = "en-US") => {

    if (!ms || isNaN(ms) || ms <= 0) return `0 ${t("keyword_second", locale)}`;

    const translate: Record<string, (n: number) => string> = {
        millennia: n => n === 1 ? t("keyword_millennia", locale) : t("keyword_millennias", locale),
        century: n => n === 1 ? t("keyword_century", locale) : t("keyword_centurys", locale),
        years: n => n === 1 ? t("keyword_year", locale) : t("keyword_years", locale),
        months: n => n === 1 ? t("keyword_month", locale) : t("keyword_months", locale),
        days: n => n === 1 ? t("keyword_day", locale) : t("keyword_days", locale),
        hours: n => n === 1 ? t("keyword_hour", locale) : t("keyword_hours", locale),
        minutes: n => n === 1 ? t("keyword_minute", locale) : t("keyword_minutes", locale),
        seconds: n => n === 1 ? t("keyword_second", locale) : t("keyword_seconds", locale),
        milliseconds: n => n === 1 ? t("keyword_millisecond", locale) : t("keyword_milliseconds", locale)
    };

    const totalYears = ms / (365.25 * 24 * 60 * 60 * 1000);
    const date: Record<string, number> = {
        millennia: Math.trunc(totalYears / 1000),
        century: Math.trunc((totalYears % 1000) / 100),
        years: Math.trunc(totalYears % 100),
        months: 0,
        days: Math.trunc(ms / 86400000),
        hours: Math.trunc(ms / 3600000) % 24,
        minutes: Math.trunc(ms / 60000) % 60,
        seconds: Math.trunc(ms / 1000) % 60,
        milliseconds: Math.trunc(ms / 1000)
    };

    if (!withMilliseconds) {
        delete date.milliseconds;
        delete translate.milliseconds;
    }

    if (date.days >= 365)
        while (date.days >= 365) {
            date.years++;
            date.days -= 365;
        }

    if (date.days >= 30)
        while (date.days >= 30) {
            date.months++;
            date.days -= 30;
        }

    if (date.years >= 1000)
        while (date.years >= 1000) {
            date.millennia++;
            date.years -= 1000;
        }

    if (date.years >= 100)
        while (date.years >= 365) {
            date.century++;
            date.years -= 100;
        }

    const timeSequency = ["millennia", "century", "years", "months", "days", "hours", "minutes", "seconds", "milliseconds"];
    let result = "";

    for (const time of timeSequency)
        if (date[time] > 0)
            result += `${date[time]} ${translate[time](date[time])} `;

    return result?.trim();
};

Date.format = (DateInMs = 0, locale, Shorted = false, withDateNow = true) => {

    if (isNaN(DateInMs) || !locale) return "";

    if (Shorted)
        return new Date(DateInMs + Date.now()).toLocaleString(locale, { timeZone: "America/Sao_Paulo" });

    const date = withDateNow ? new Date(DateInMs + Date.now()) : new Date(DateInMs);
    return Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "medium" }).format(date);
};

Date.toDiscordTime = (TimeToCooldown, DateNowInDatabase, style?: TimestampStylesString) => {
    const Time = ~~(((TimeToCooldown || 0) + (DateNowInDatabase || 0)) / 1000);
    return time(Time, style || "t");
};

Date.toDiscordCompleteTime = (date: number | Date) => {

    if (!date) return "??";

    if (typeof date === "number")
        return `${time(new Date(date), "d")} ${time(new Date(date), "T")}`;

    return `${time(date, "d")} ${time(date, "T")}`;
};

Date.Timeout = (TimeoutInMS = 0, DateNowAtDatabase = 0) => TimeoutInMS - (Date.now() - DateNowAtDatabase) > 0;