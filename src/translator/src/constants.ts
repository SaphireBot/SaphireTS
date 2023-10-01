import type { Options } from "./@types";

export const defaults = <Options>{
  interpolation: {
    functionTokenPrefix: "(",
    functionTokenSuffix: ")",
    prefix: "{{",
    suffix: "}}"
  },
  multiKeyJoiner: " ",
  translation: {
    fallbackLocale: "en",
    keySeparator: ".",
    pluralSeparator: "_",
    returnNull: false
  }
};
