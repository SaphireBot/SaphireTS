import type { Resources } from "./@types";
import { mergeDefaults } from "./utils";

export default class Cache {
  readonly resources: Resources = {};

  mergeResources(resources: Resources) {
    mergeDefaults(resources, this.resources);
  }

  setResources(resources: Resources) {
    const keys = Object.keys(this.resources);

    for (let i = 0; i < keys.length; i++) {
      delete this.resources[keys[i]];
    }

    Object.assign(this.resources, resources);
  }
}

export const cache = new Cache();
