import type { DeepPartialOptions, Options, locale } from "./@types";
import { cache } from "./Cache";
import Interpolator from "./Interpolator";
import PostProcessor from "./PostProcessor";
import Translator from "./Translator";
import { defaults } from "./constants";
import { bindFunctions, getAvailableLocales, getTranslationsStats, mergeDefaults } from "./utils";

export default class Ijsn {
  declare readonly interpolator: Interpolator;
  declare readonly postProcessor: PostProcessor;
  declare readonly translator: Translator;
  declare readonly options: Options;

  constructor(options: Partial<Options> = {}) {
    this.options = mergeDefaults(defaults, options);

    Object.defineProperties(this, {
      interpolator: {
        value: new Interpolator(this)
      },
      postProcessor: {
        value: new PostProcessor(this)
      },
      translator: {
        value: new Translator(this)
      }
    });

    bindFunctions(this);
  }

  init(options: DeepPartialOptions) {
    if (options.resources) {
      cache.setResources(<any>options.resources);
      delete options.resources;
    }

    Object.assign(this.options, mergeDefaults(defaults, options));

    this.updateStats(options);
  }

  updateStats(options: DeepPartialOptions = this.options) {
    if (options.Locales) {
      const Locales = <[any, any][]>Object.entries(options.Locales)
        .sort((a, b) => a[0] < b[0] ? -1 : 1);

      this.options.LocalesEnum = Object.fromEntries(Locales.concat(Locales.map(([key, value]) => [value, key])));

      this.options.Locales = Object.fromEntries(Locales.map(([key, value]) =>
        key.length < (value?.length ?? 0) ? [key, value] : [value, key]));
    }

    this.options.availableLocales = getAvailableLocales(cache.resources, this.options.Locales);

    this.options.stats =
      getTranslationsStats(cache.resources, this.options.translation.fallbackLocale, this.options.Locales);
  }

  /**
   * @param key
   * @param localeOrOptions - `Options` OR `locale`
   */
  t(key: string | string[], localeOrOptions?: DeepPartialOptions | locale): string
  /**
   * @param key
   * @param options - `Options`
   */
  t(key: string | string[], options: DeepPartialOptions & { translation: { returnNull: true } }): string | null
  /**
   * @param key
   * @param options - `Options` OR `locale`
   */
  t(key: string | string[], options: DeepPartialOptions | locale = {}): string | null {
    if (typeof options === "string") {
      options = { locale: options };
    }

    if (options.resources) {
      cache.mergeResources(<any>options.resources);
      this.updateStats();
      delete options.resources;
    }

    if (Array.isArray(key)) {
      return key.reduce<string[]>((acc, k) => acc.concat(this.t(k, options)), [])
        .join(options.multiKeyJoiner ?? this.options.multiKeyJoiner);
    }

    key = this.translator.translate(key, options);

    if (typeof key === "string") {
      key = this.interpolator.interpolate(key, options);

      if (
        typeof options.capitalize === "boolean" ||
        (typeof this.options.capitalize === "boolean" && options.capitalize !== null)
      ) {
        key = this.postProcessor.capitalize(key, options);
      }
    }

    return key;
  }
}

export const ijsn = new Ijsn();
