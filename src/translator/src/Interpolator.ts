import type { Options } from "./@types";
import Idjsn from "./Idjsn";

export default class Interpolator {
  declare protected readonly idjsn: Idjsn;

  constructor(idjsn: Idjsn) {
    Object.defineProperty(this, "idjsn", { value: idjsn });
  }

  get options() {
    return this.idjsn.options.interpolation;
  }

  get pattern() {
    return RegExp(`${this.options.prefix}(.*?)${this.options.suffix}`);
  }

  get patterng() {
    return RegExp(`(${this.options.prefix}.*?${this.options.suffix})`, "g");
  }

  interpolate(key: string, options: Partial<Options>): string {
    const pattern = this.pattern;

    return key.split(this.patterng)
      .reduce<string[]>((previousValue, currentValue) => {
        const matched = currentValue.match(pattern);

        if (!matched) return previousValue.concat(currentValue);

        const splitted = matched[1].split(/\W/).filter(Boolean);

        for (const value of splitted) {
          currentValue = splitted.at(0) === value ?
            options[value] :
            currentValue?.[<any>value];

          if (typeof currentValue === "function") {
            currentValue = (<any>currentValue)();
          }
        }

        return previousValue.concat(currentValue);
      }, []).join("");
  }
}
