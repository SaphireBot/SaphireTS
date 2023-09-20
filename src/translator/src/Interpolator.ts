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

  get patterng() {
    return RegExp(`(${scapeRegex(this.options.prefix)}.*?${scapeRegex(this.options.suffix)})`, "g");
  }

  interpolate(key: string, options: DeepPartialOptions): string {
    const pattern = this.pattern;

    return key.split(this.patterng)
      .reduce<string[]>((previousValue, currentValue) => {
        const matched = currentValue.match(pattern);
        if (!matched) return previousValue.concat(currentValue);

        const splitted = matched[1].split(/\W/).filter(Boolean);

        const functionParams = matched[1].match(/\((.+)\)/g);
        for (let i = 0; i < splitted.length; i++) {
          currentValue = +i
            ? currentValue?.[<any>splitted[i]]
            : options[splitted[i]];

          if (typeof currentValue === "function") {
            if (functionParams?.length) {
              const params = functionParams.shift()!;

              const parsedParams = params.split(/[(),\s]/).filter(Boolean);

              for (let j = 0; j < parsedParams.length; j++) {
                splitted.splice(+i, parsedParams[j].split(/\W/).length);
                const indexOfPrefix = params.indexOf(parsedParams[j] + "(");

                if (indexOfPrefix > +j) {
                  parsedParams[j] += params.slice(indexOfPrefix + 1, params.indexOf(")") + 1);
                }

                parsedParams[j] = this.interpolate(`${this.options.prefix}${parsedParams[j]}${this.options.suffix}`, options);
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
