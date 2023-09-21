export interface InterpolationOptions {
  /** @default "{{" */
  prefix: string
  /** @default "}}" */
  suffix: string
}

export interface TranslationOptions {
  /** @default "en" */
  fallbackLocale: locale
  /**
   * @description Set `null` to not separate
   * @default "."
   */
  keySeparator: string | null
  /**
   * @description Set `null` to not separate
   * @default "_"
   */
  pluralSeparator: string | null
  /** @default false */
  returnNull: boolean
}

export interface Options {
  [x: string]: any
  availableLocales: Record<string, boolean>
  capitalize: boolean | null
  count: number
  interpolation: InterpolationOptions
  locale: locale
  Locales: EnumLike<Record<string, string>, string>
  LocalesEnum: Record<string, string>
  resources: Resources
  stats: Record<string, number>
  translation: TranslationOptions
}

export type DeepPartialOptions = DeepPartial<Options>;

type Resource = Record<string, unknown>;

export type Resources = Record<locale, Resource>;

export type locale = string;

type EnumLike<E, V> = Record<keyof E, V>;

export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;
