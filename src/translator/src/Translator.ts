import type { DeepPartialOptions } from "./@types";
import { cache } from "./Cache";
import Ijsn from "./Ijsn";

export default class Translator {
  declare protected readonly ijsn: Ijsn;

  constructor(ijsn: Ijsn) {
    Object.defineProperty(this, "ijsn", { value: ijsn });
  }

  get options() {
    return this.ijsn.options.translation;
  }

  translate(key: string, options: DeepPartialOptions & { translation: { returnNull: true } }): string | null;
  translate(key: string, options: DeepPartialOptions): string;
  translate(key: string, options: DeepPartialOptions): string | null {
    const locale = options.locale ?? this.options.fallbackLocale;

    const pluralRules = new Intl.PluralRules(locale);

    const keySeparator = options.translation?.keySeparator !== null ?
      options.translation?.keySeparator ?? this.options.keySeparator ?? undefined! :
      undefined!;

    const pluralSeparator = options.translation?.pluralSeparator !== null ?
      options.translation?.pluralSeparator ?? this.options.pluralSeparator ?? "" :
      "";

    const pluralSuffix = pluralRules.select(options.count ?? 1);

    if (keySeparator === pluralSeparator) {
      key += pluralSeparator + pluralSuffix;
    }

    const returnNull = options.translation?.returnNull ?? this.options.returnNull;

    return key.split(keySeparator)
      .reduce<any>((acc, k) => {
        const pluralKey = k + pluralSeparator + pluralSuffix;

        return acc?.[pluralKey] ?? acc?.[k] ??
          (returnNull ? null : this.translate(key, Object.assign(options, {
            locale: this.options.fallbackLocale,
            translation: Object.assign(options.translation ??= {}, {
              returnNull: true
            })
          })) ?? k);
      }, cache.resources[locale] ?? cache.resources[locale?.split(/[_-]/)[0]]);
  }
}
