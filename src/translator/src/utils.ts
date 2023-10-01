import { PathLike, existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { DeepPartial, Resources } from "./@types";

export function bindFunctions(instance: any) {
  const propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance));

  for (const propertyName of propertyNames) {
    if (typeof instance[propertyName] === "function")
      instance[propertyName] = instance[propertyName].bind(instance);
  }
}

export function getAvailableLocales(resources: Resources, locales?: Record<string, string>) {
  return Object.fromEntries(Object.keys(locales ?? resources)
    .map(locale => [locale, resources[locale] ? true : false]));
}

export function getTranslationsStats(resources: Resources, fallbackLocale: string, locales?: Record<string, string>) {
  if (!resources[fallbackLocale]) return {};

  const fallbackLocaleLength = Object.keys(resources[fallbackLocale]).length;

  if (locales)
    resources = Object.fromEntries(Object.keys(locales).map(locale => [locale, resources[locale] ?? {}]));

  const stats = Object.fromEntries(Object.entries(resources).map(([locale, translations]) =>
    [locale, percentage(Object.keys(translations).length, fallbackLocaleLength)]));

  const statsValues = Object.values(stats);

  stats.total = Number((statsValues.reduce((acc, val) => acc + val, 0) / statsValues.length).toFixed(2));

  return stats;
}

export function loadResources(localesPath: PathLike, resources: Resources = {}) {
  if (!localesPath) throw TypeError("locales path is missing");
  if (!existsSync(localesPath)) throw Error("locales path does not exists");
  if (!resources || typeof resources !== "object") resources = {};

  localesPath = localesPath.toString("utf8");

  const files = readdirSync(localesPath, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      mergeDefaults(loadResources(join(localesPath, file.name)), <any>(resources[file.name] ??= {}));
      continue;
    }

    if (file.isFile()) {
      try {
        mergeDefaults(JSON.parse(readFileSync(join(localesPath, file.name), "utf8")), resources ??= {});
      } catch (error) {
        console.error(error);
      }
      continue;
    }
  }

  return resources;
}

export function mergeDefaults<A extends Record<any, any>>(defaults: A, options: DeepPartial<A>): A {
  if (options === null) return options;
  if (options === undefined) return defaults;

  for (const key of Object.keys(defaults)) {
    if (typeof options[key] === "object") {
      options[key as keyof A] = mergeDefaults(defaults[key], options[key]);
    } else {
      options[key as keyof A] ??= defaults[key];
    }
  }

  return options as A;
}

export function percentage(partialValue: number, totalValue: number) {
  return Number(((100 * partialValue) / totalValue).toFixed(2));
}

export function scapeRegex(s: string) {
  return s.replace(/[\^$\\.*+?()[\]{}|/]/g, "\\$&");
}
