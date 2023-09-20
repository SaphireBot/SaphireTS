export interface InterpolationOptions {
  prefix: string
  suffix: string
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

export interface TranslationOptions {
  fallbackLocale: locale
  keySeparator: string
  noScape: boolean
}

export type locale = string;

type EnumLike<E, V> = Record<keyof E, V>;

export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;
