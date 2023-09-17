Date.stringDate = (ms = 0, withMilliseconds = false) => {

    if (!ms || isNaN(ms) || ms <= 0) return "0 segundo";

    const translate: Record<string, (n: number) => string> = {
        millennia: n => n === 1 ? "milênio" : "milênios",
        century: n => n === 1 ? "século" : "séculos",
        years: n => n === 1 ? "ano" : "anos",
        months: n => n === 1 ? "mês" : "meses",
        days: n => n === 1 ? "dia" : "dias",
        hours: n => n === 1 ? "hora" : "horas",
        minutes: n => n === 1 ? "minuto" : "minutos",
        seconds: n => n === 1 ? "segundo" : "segundos",
        milliseconds: n => n === 1 ? "milissegundo" : "milissegundos"
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

Date.format = (DateInMs = 0, Shorted = false, withDateNow = true) => {

    if (isNaN(DateInMs)) return "";

    if (Shorted)
        return new Date(DateInMs + Date.now()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const date = withDateNow ? new Date(DateInMs + Date.now()) : new Date(DateInMs);
    return Intl.DateTimeFormat("'pt-BR", { dateStyle: "full", timeStyle: "medium" }).format(date);
};