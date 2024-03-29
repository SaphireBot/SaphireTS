import { LocaleString } from "discord.js";

Array.prototype.asMessageComponents = function () {
    return this;
};

Array.prototype.format = function (locale: LocaleString = "en-US"): string {
    const formatter = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
    return formatter.format(this);
};

Array.prototype.random = function (amount?: number, repeat = false) {

    const newArray = [];
    
    if ((amount || 1) > 1) {
        if (repeat)
            for (let i = 0; i < (amount || 1); i++)
                newArray.push(this[~~(Math.random() * this.length)]);
        else {
            const originalArray = [...this];
            for (let i = 0; i < (amount || 1); i++) {
                if (!originalArray.length) break;
                const value = ~~(Math.random() * originalArray.length);
                newArray.push(originalArray[value]);
                originalArray.splice(value, 1);
            }
        }

        return newArray;
    }

    return this[~~(Math.random() * this.length)];
};

Array.prototype.randomize = function () {
    return this.sort(() => Math.random() - Math.random());
};