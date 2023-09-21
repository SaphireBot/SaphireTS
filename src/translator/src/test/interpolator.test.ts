import assert from "node:assert";
import test from "node:test";
import Ijsn from "../Ijsn";

const ijsn = new Ijsn();

test("Empty interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any}}", {});

  assert.equal(result, "");
});

test("Basic interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any}}", { any: "Hello World!" });

  assert.equal(result, "Hello World!");
});

test("Multi interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{a}} {{b}}", { a: "Hello World!", b: "Test" });

  assert.equal(result, "Hello World! Test");
});

test("Array interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any.0}}", { any: ["Hello World!"] });

  assert.equal(result, "Hello World!");
});

test("Deep array interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any.1.0}}", { any: [null, ["Hello World!"]] });

  assert.equal(result, "Hello World!");
});

test("Object interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any.test}}", { any: { test: "Hello World!" } });

  assert.equal(result, "Hello World!");
});

test("Deep object interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{a.b.c.d.e}}", { a: { b: { c: { d: { e: "Hello World!" } } } } });

  assert.equal(result, "Hello World!");
});

test("Function interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any()}}", { any: () => "Hello World!" });

  assert.equal(result, "Hello World!");
});

test("Function without call interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any}}", { any: () => "Hello World!" });

  assert.equal(result, "() => \"Hello World!\"");
});

test("Function with one param interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any(param)}}", {
    any: (param: string) => `Hello ${param}!`,
    param: "World"
  });

  assert.equal(result, "Hello World!");
});

test("Function with two params interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any(param1,param2)}}", {
    any: (p1: string, p2: string) => `${p1} ${p2}!`,
    param1: "Hello",
    param2: "World"
  });

  assert.equal(result, "Hello World!");
});

test("Function with seven params interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any(param1,param2, param3, param4, param5, param6, param7)}}", {
    any: (p1: string, p2: string, p3: string, p4: string, p5: string, p6: string, p7: string) =>
      `${p1} ${p2} ${p3} ${p4} ${p5} ${p6} ${p7}!`,
    param1: "Hello",
    param2: "World",
    param3: "compilation",
    param4: "watch",
    param5: "Starting",
    param6: "Watching",
    param7: "changes."
  });

  assert.equal(result, "Hello World compilation watch Starting Watching changes.!");
});

test("Deep function with two params when the first is called interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any(param1(),param2)}}", {
    any: (p1: string, p2: string) => `${p1} ${p2}!`,
    param1: () => "Hello",
    param2: () => "World"
  });

  assert.equal(result, "Hello () => \"World\"!");
});

test("Deep function with two params when the second is called interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any(param1,param2())}}", {
    any: (p1: string, p2: string) => `${p1} ${p2}!`,
    param1: () => "Hello",
    param2: () => "World"
  });

  assert.equal(result, "() => \"Hello\" World!");
});

test("Deep function with two params when all is called interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any(param1(),param2())}}", {
    any: (p1: string, p2: string) => `${p1} ${p2}!`,
    param1: () => "Hello",
    param2: () => "World"
  });

  assert.equal(result, "Hello World!");
});

test("More deep function with two params when all is called interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any(param1(p3()),param2())}}", {
    any: (p1: string, p2: string) => `${p1} ${p2}!`,
    param1: (p3: string) => p3 + " Hello",
    param2: () => "World",
    p3: () => "Tested"
  });

  assert.equal(result, "Tested Hello World!");
});

test("More more deep function with three params when all is called interpolation", () => {
  const result = ijsn.interpolator.interpolate("{{any(param1(p3(),p4),param2(),param3())}}", {
    any: (p1: string, p2: string, p3: string, p4: string) => `${p1} ${p2} ${p3} ${p4}!`,
    param1: (p3: string) => p3 + " Hello",
    param2: () => "World",
    param3: () => "ABC",
    p3: () => "Tested",
    p4: "testing4"
  });

  assert.equal(result, "Tested Hello testing4 World ABC!");
});
