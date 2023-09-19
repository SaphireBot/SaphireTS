import type { Options } from "./@types";
import Idjsn from "./Idjsn";

export default class PostProcessor {
  declare protected readonly idjsn: Idjsn;

  constructor(idjsn: Idjsn) {
    Object.defineProperty(this, "idjsn", { value: idjsn });
  }

  get options() {
    return this.idjsn.options;
  }

  capitalize(string: string, options: Partial<Options>) {
    if (options.capitalize || this.options.capitalize)
      return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;

    return `${string.charAt(0).toLowerCase()}${string.slice(1)}`;
  }
}
