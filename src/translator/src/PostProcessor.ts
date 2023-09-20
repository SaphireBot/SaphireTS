import type { DeepPartialOptions } from "./@types";
import Ijsn from "./Ijsn";

export default class PostProcessor {
  declare protected readonly ijsn: Ijsn;

  constructor(ijsn: Ijsn) {
    Object.defineProperty(this, "ijsn", { value: ijsn });
  }

  get options() {
    return this.ijsn.options;
  }

  capitalize(string: string, options: DeepPartialOptions) {
    if (options.capitalize || this.options.capitalize)
      return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;

    return `${string.charAt(0).toLowerCase()}${string.slice(1)}`;
  }
}
