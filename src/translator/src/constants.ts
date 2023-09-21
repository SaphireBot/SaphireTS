import type { Options } from "./@types";

export const defaults = <Options>{
  interpolation: {
    prefix: "{{",
    suffix: "}}"
  },
  translation: {
    fallbackLocale: "en",
    keySeparator: ".",
    pluralSeparator: "_",
    returnNull: false
  }
};
