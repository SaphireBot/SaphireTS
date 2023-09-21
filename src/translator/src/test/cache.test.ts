import assert from "node:assert";
import test from "node:test";
import Cache from "../Cache";

const cache = new Cache();

test("cache resources initilization", () => {
  assert.deepStrictEqual(cache.resources, {});

  const expected = {
    en: {
      key: "value"
    }
  };

  cache.setResources(expected);

  assert.deepStrictEqual(cache.resources, expected);
});

test("cache resources replacing", () => {
  const expected = {
    ja: {
      key2: "value2"
    }
  };

  cache.setResources(expected);

  assert.deepStrictEqual(cache.resources, expected);
});

test("cache resources merging", () => {
  const resources2 = {
    en: {
      key: "value"
    },
    ja: {
      key3: "value3"
    }
  };

  cache.mergeResources(resources2);

  const expected = {
    en: {
      key: "value"
    },
    ja: {
      key2: "value2",
      key3: "value3"
    }
  };

  assert.deepStrictEqual(cache.resources, expected);
});
