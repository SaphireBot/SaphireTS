import { APIMessageComponentEmoji, parseEmoji } from "discord.js";
import moment from "moment-timezone";

String.prototype.emoji = function () {
    return parseEmoji(<string>this) as APIMessageComponentEmoji;
};

String.prototype.limit = function (option) {

    if (typeof option === "number")
        return this.slice(0, option);

    const limit = {
        MessageEmbedTitle: 256,
        MessageEmbedDescription: 4096,
        MessageEmbedFields: 25,
        MessageEmbedFieldName: 256,
        MessageEmbedFieldValue: 1024,
        MessageEmbedFooterText: 2048,
        MessageEmbedAuthorName: 256,
        MessageContent: 2000,
        AutocompleteName: 100,
        AutocompleteValue: 100,
        SelectMenuLabel: 100,
        SelectMenuPlaceholder: 150,
        SelectMenuDescription: 100,
        SelectMenuValue: 100,
        ButtonLabel: 80
    }[option] || this.length;

    if (this.length > limit)
        return `${this.slice(0, limit - 3)}...`;

    return this.slice(0, limit);
};

String.prototype.compare = function (array: string[]) {

    const results = [];
    for (const string of array)
        results.push({ string, percent: similarity(string, `${this}`) });

    const target = results.sort((a, b) => b.percent - a.percent)[0];
    return target.percent > 75 ? target.string : undefined;
};

String.prototype.toDateMS = function (): number {

    let time = new String(this);
    if (!time?.length) return 0;

    if (time === "00:00") time = "tomorrow 00:00";

    let args = time?.toLowerCase()?.trim().split(/ +/g);
    let timeResult = 0;
    const today = new Date().getDay();

    const week = {
        domingo: 0, sunday: 0,
        segunda: 1, "segunda-feira": 1, monday: 1,
        terça: 2, "terça-feira": 2, tuesday: 2,
        quarta: 3, "quarta-feira": 3, wednesday: 3,
        quinta: 4, "quinta-feira": 4, thursday: 4,
        sexta: 5, "sexta-feira": 5, friday: 5,
        sabado: 6, sábado: 6, saturday: 6,
        hoje: today + 1, today: today + 1, tomorrow: today + 1, amanhã: today + 1
    }[args[0]?.toLowerCase()];

    if (week !== undefined)
        return calculateWeek();

    return args[0].includes("/") || args[0].includes(":") ? withDay() : minimalDay();

    function minimalDay() {
        for (let i = 0; i < args.length; i++) {

            const base = [
                {
                    conditional: ["a", "y"].includes(args[i].at(-1) || "") || ["ano", "year", "anos", "y"].includes(args[i + 1]),
                    multiplier: 60 * 60 * 24 * 365,
                    includer: ["a", "y"].includes(args[i].at(-1) || "")
                },
                {
                    conditional: args[i].at(-1)?.includes("d") || ["dias", "dia", "day", "days", "d"].includes(args[i + 1]),
                    multiplier: 60 * 60 * 24,
                    includer: args[i]?.at(-1)?.includes("d")
                },
                {
                    conditional: args[i].slice(-1)?.includes("h") || ["horas", "hora", "hour", "hours", "h"].includes(args[i + 1]),
                    multiplier: 60 * 60,
                    includer: args[i].slice(-1)?.includes("h")
                },
                {
                    conditional: args[i].slice(-1).includes("m") || ["minuto", "minutos", "minute", "minutes", "m"].includes(args[i + 1]),
                    multiplier: 60,
                    includer: args[i].slice(-1).includes("m")
                },
                {
                    conditional: args[i].slice(-1).includes("s") || ["segundo", "segundos", "second", "seconds", "s"].includes(args[i + 1]),
                    multiplier: 1,
                    includer: args[i].slice(-1).includes("s")
                }
            ];

            for (const { conditional, multiplier, includer } of base)
                if (conditional) {
                    const string = includer ? `${args[i]}` : `${args[i]}${args[i + 1]}`;
                    const time = formatString(string) * multiplier;
                    timeResult += time;
                    continue;
                }

            continue;
        }
        return timeResult;
    }

    function withDay() {

        let data = args[0];
        let hour = args[1];

        if (["tomorrow", "amanhã", "amanha"].includes(data.toLowerCase()))
            data = day(true);

        if (["hoje", "today"].includes(data.toLowerCase()))
            data = day();

        if (!hour && data.includes(":") && data.length <= 8) {
            data = day();
            hour = args[0];
        }

        if (data.includes("/") && data.length === 10 && !hour)
            hour = "12:00";

        if (!data || !hour) return 0;

        const dataArray = data.split("/");
        const hourArray = hour.split(":");
        const dia = parseInt(dataArray[0]);
        const mes = parseInt(dataArray[1]) - 1;
        const ano = parseInt(dataArray[2]) || new Date().getFullYear();
        const hora = parseInt(hourArray[0]) || 0;
        const minutos = parseInt(hourArray[1]) || 0;
        const segundos = parseInt(hourArray[2]) || 0;

        let date: moment.Moment | number = moment.tz({ day: dia, month: mes, year: ano, hour: hora, minutes: minutos, seconds: segundos }, "America/Sao_Paulo");
        if (!date.isValid()) return 0;
        date = date.valueOf();
        if (date < Date.now()) return 0;
        timeResult += date - Date.now();

        return timeResult;
    }

    function calculateWeek() {

        const date = new Date();
        date.setDate(date.getDate() + ((week || 0) - 1 - date.getDay() + 7) % 7 + 1);
        args = `${date.toLocaleDateString("pt-BR")} ${args.slice(1).join(" ") || "12:00"}`.split(/ +/g);
        return withDay();
    }

};

const keys = { k: 1_000, m: 1_000_000, b: 1_000_000_000, t: 1_000_000_000_000 };
String.prototype.toNumber = function () {

    const matches = this.match(/^([\d.,_]+)(k{1,3}|m{1,2}|b{1}|t{1})?$/i);
    if (!matches) return Number(this);

    let num = parseInt(matches[1]);
    const sufix = matches[2]?.toLowerCase();
    if (isNaN(num)) return 0;
    if (!sufix) return Number(this);
    for (const l of sufix) num *= keys[l as keyof typeof keys];

    return num;
};

function day(tomorrow = false) {

    const date = new Date();

    if (tomorrow)
        date.setDate(date.getDate() + 1);

    const Mes = FormatNumber(date.getMonth() + 1);
    const Dia = FormatNumber(date.getDate());
    const Ano = date.getFullYear();

    return `${Dia}/${Mes}/${Ano}`;

    function FormatNumber(number: number) {
        return number < 10 ? `0${number}` : number;
    }
}

function formatString(string: string) {
    return Number(string
        .replace(/(\D+)/, str => {
            if ([
                "s",
                "segundo",
                "segundos",
                "second",
                "seconds",

                "m",
                "minuto",
                "minutos",
                "minutes",
                "minute",

                "h",
                "hora",
                "horas",
                "hour",
                "hours",

                "d",
                "dia",
                "dias",
                "day",
                "days",

                "a",
                "ano",
                "anos",

                "y",
                "year",
                "years",
            ].includes(str)) return "000";
            return "";
        }));
}

function similarity(first: string, second: string) {
    first = first.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
    second = second.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
    if (first === second) return 100;

    [first, second] = [first, second].sort((a, b) => b.length - a.length);

    const firstSlices: Record<string, number> = {};
    for (let i = 0; i < first.length; i++) {
        const slice = first[i];

        firstSlices[slice] ? firstSlices[slice]++ : firstSlices[slice] = 1;
    }

    let intersections = 0;
    for (let i = 0; i < second.length; i++) {
        const slice = second[i];

        if (firstSlices[slice]) {
            firstSlices[slice]--;
            intersections++;
        }
    }

    return intersections / ((first.length + second.length) / 2) * 100;
}