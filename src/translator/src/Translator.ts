import type { DeepPartialOptions } from "./@types";
import cache from "./Cache";
import Ijsn from "./Ijsn";

export default class Translator {
  declare protected readonly ijsn: Ijsn;

  constructor(ijsn: Ijsn) {
    Object.defineProperty(this, "ijsn", { value: ijsn });
  }

  get options() {
    return this.ijsn.options.translation;
  }

  translate(key: string, options: DeepPartialOptions) {
    const fallbackLocale = cache.resources?.[this.options.fallbackLocale!];

    const locale = options.locale ?? this.options.fallbackLocale;

    const pluralRules = new Intl.PluralRules(locale);

    const noScape = options.translation?.noScape ?? this.options.noScape;

    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const translation = cache.resources[locale!] ?? cache.resources[locale?.split(/[_-]/)[0]!];

    return <string>key.split(options.translation?.keySeparator ?? this.options.keySeparator!)
      .reduce<any>((acc, k) => {
        const pluralKey = `${k}_${pluralRules.select(options.count ?? 1)}`;

        return acc?.[pluralKey] ?? acc?.[k] ??
          (noScape ? null : fallbackLocale?.[pluralKey] ?? fallbackLocale?.[k] ?? k);
      }, translation);
  }
}
