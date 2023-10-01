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

  protected _getFunctionTokenPrefix(options: DeepPartialOptions) {
    return options.interpolation?.functionTokenPrefix ?? this.options.functionTokenPrefix;
  }

  protected _getFunctionTokenSuffix(options: DeepPartialOptions) {
    return options.interpolation?.functionTokenSuffix ?? this.options.functionTokenSuffix;
  }

  protected _getFunctionParamsPattern(o: DeepPartialOptions) {
    return RegExp(`${scapeRegex(this._getFunctionTokenPrefix(o))}(.+)${scapeRegex(this._getFunctionTokenSuffix(o))}`, "g");
  }

  protected _getInterpolationPrefix(options: DeepPartialOptions) {
    return options.interpolation?.prefix ?? this.options.prefix;
  }

  protected _getInterpolationSuffix(options: DeepPartialOptions) {
    return options.interpolation?.suffix ?? this.options.suffix;
  }

  protected _getInterpolationPattern(o: DeepPartialOptions) {
    return RegExp(`${scapeRegex(this._getInterpolationPrefix(o))}(.*?)${scapeRegex(this._getInterpolationSuffix(o))}`);
  }

  protected _getInterpolationSplitterPattern(o: DeepPartialOptions) {
    return RegExp(`(${scapeRegex(this._getInterpolationPrefix(o))}.*?${scapeRegex(this._getInterpolationSuffix(o))})`);
  }

  interpolate(key: string, options: DeepPartialOptions): string {
    const functionParamsPattern = this._getFunctionParamsPattern(options);
    const functionTokenPrefix = this._getFunctionTokenPrefix(options);
    const functionTokenSuffix = this._getFunctionTokenSuffix(options);

    const interpolationPattern = this._getInterpolationPattern(options);
    const interpolationPrefix = this._getInterpolationPrefix(options);
    const interpolationSuffix = this._getInterpolationSuffix(options);

    return key.split(this._getInterpolationSplitterPattern(options))
      .reduce<string[]>((previousValue, currentValue) => {
        const matched = currentValue.match(interpolationPattern);

        if (!matched) return previousValue.concat(currentValue);

        const splitted = matched[1].split(/\W/).filter(Boolean);

        const functionParams = matched[1].match(functionParamsPattern);

        for (let i = 0; i < splitted.length; i++) {
          currentValue = i ?
            currentValue?.[<any>splitted[i]] :
            options[splitted[i]];

          if (typeof currentValue === "function") {
            if (functionParams?.length) {
              const params = functionParams.shift()!.replace(/\s/g, "");

              const loopBegin = params.indexOf(functionTokenPrefix) === 0 ? 1 : 0;

              let opens = 0, closes = 0, param = "";
              const parsedParams = [];

              for (let j = loopBegin; j < params.length; j++) {
                param += params[j];
                if (params[j] === functionTokenPrefix) opens++;
                if (params[j] === functionTokenSuffix) closes++;

                if (!opens || opens !== closes) continue;
                splitted.splice(i + 1, param.split(",").length);
                for (const p of param.split(",").filter(Boolean)) {
                  parsedParams.push(this.interpolate(`${interpolationPrefix}${p}${interpolationSuffix}`, options));
                }

                opens = 0; closes = 0; param = "";
              }

              if (param) {
                splitted.splice(i + 1, param.split(",").length);
                for (const p of param.split(",").filter(Boolean)) {
                  parsedParams.push(this.interpolate(`${interpolationPrefix}${p}${interpolationSuffix}`, options));
                }
              }

              currentValue = (<any>currentValue)(...parsedParams);
            } else if (matched[1].includes(functionTokenPrefix + functionTokenSuffix)) {
              currentValue = (<any>currentValue)();
            }
          }
        }

        return previousValue.concat(currentValue);
      }, []).join("");
  }
}
