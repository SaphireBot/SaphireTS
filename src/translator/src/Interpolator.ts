import type { DeepPartialOptions } from "./@types";
import Ijsn from "./Ijsn";
import { scapeRegex } from "./utils";

export default class Interpolator {
  declare protected readonly ijsn: Ijsn;

  constructor(ijsn: Ijsn) {
    Object.defineProperty(this, "ijsn", { value: ijsn });
  }

  get options() {
    return this.ijsn.options.interpolation;
  }

  get pattern() {
    return RegExp(`${scapeRegex(this.options.prefix)}(.*?)${scapeRegex(this.options.suffix)}`);
  }

  get splitterPattern() {
    return RegExp(`(${scapeRegex(this.options.prefix)}.*?${scapeRegex(this.options.suffix)})`);
  }

  interpolate(key: string, options: DeepPartialOptions): string {
    const pattern = this.pattern;

    return key.split(this.splitterPattern)
      .reduce<string[]>((previousValue, currentValue) => {
        const matched = currentValue.match(pattern);

        if (!matched) return previousValue.concat(currentValue);

        const splitted = matched[1].split(/\W/).filter(Boolean);

        const functionParams = matched[1].match(/\((.+)\)/g);

        for (let i = 0; i < splitted.length; i++) {
          currentValue = i ?
            currentValue?.[<any>splitted[i]] :
            options[splitted[i]];

          if (typeof currentValue === "function") {
            if (functionParams?.length) {
              const params = functionParams.shift()!.replace(/\s/g, "");

              const loopBegin = params.indexOf("(") === 0 ? 1 : 0;

              let opens = 0, closes = 0, param = "";
              const parsedParams = [];

              for (let j = loopBegin; j < params.length; j++) {
                param += params[j];
                if (params[j] === "(") opens++;
                if (params[j] === ")") closes++;

                if (!opens || opens !== closes) continue;
                splitted.splice(i + 1, param.split(",").length);
                for (const p of param.split(",").filter(Boolean)) {
                  parsedParams.push(this.interpolate(`${this.options.prefix}${p}${this.options.suffix}`, options));
                }

                opens = 0; closes = 0; param = "";
              }

              if (param) {
                splitted.splice(i + 1, param.split(",").length);
                for (const p of param.split(",").filter(Boolean)) {
                  parsedParams.push(this.interpolate(`${this.options.prefix}${p}${this.options.suffix}`, options));
                }
              }

              currentValue = (<any>currentValue)(...parsedParams);
            } else if (matched[1].includes("()")) {
              currentValue = (<any>currentValue)();
            }
          }
        }

        return previousValue.concat(currentValue);
      }, []).join("");
  }
}
