export interface InterpolationOptions {
  prefix?: string
  suffix?: string
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

type Resource = Record<string, unknown>;

export type Resources = Record<locale, Resource>;

export interface TranslationOptions {
  fallbackLocale?: string
  keySeparator?: string
  noScape?: boolean
}

export type locale = string;

type EnumLike<E, V> = Record<keyof E, V>;
