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

    if (options.Locales) {
      const Locales = Object.entries(options.Locales).sort((a, b) => a[0] < b[0] ? -1 : 1)
        .map(([key, value]) => /^[a-z]{2}(-[A-Z]{2})?$/.test(key) ? [key, value] : [value, key]);

      this.options.Locales = Object.fromEntries(Locales);

      this.options.LocalesEnum = Object.fromEntries(Locales.concat(Locales.map(([key, value]) => [value, key])));
    }

    this.options.availableLocales = getAvailableLocales(cache.resources, <any>options.Locales);

    this.options.stats =
      getTranslationsStats(cache.resources, options.translation!.fallbackLocale!, <any>options.Locales);
  }

  /**
   * @param key
   * @param options - `Options` OR `locale`
   */
  t(key: string | string[], options: DeepPartialOptions | locale = {}): string {
    if (typeof options === "string") {
      options = { locale: options };
    }

    if (options.resources) cache.mergeResources(<any>options.resources);

    if (Array.isArray(key)) {
      return key.reduce((acc, k) => `${acc} ${this.t(k, options)}`, "");
    }

    key = this.translator.translate(key, options);

    if (typeof key === "string") {
      key = this.interpolator.interpolate(key, options);

      if (
        typeof options.capitalize === "boolean" || typeof this.options.capitalize === "boolean"
      ) {
        if (options.capitalize !== null) {
          key = this.postProcessor.capitalize(key, options);
        }
      }
    }

    return key;
  }
}

export const ijsn = new Ijsn();
