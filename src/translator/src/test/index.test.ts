import assert from "node:assert";
import test from "node:test";
import { ijsn } from "../";

const resources = {
  "en": {
    function: "{{a(b, c)}} {{d(e(h,i), j)}} {{f.g}}{{h()}}",
    a: {
      b: "a {{c.d}} b {{f.g}}, cde {{h}} fg {{c.e}} hi {{i}}"
    }
  }
};

ijsn.init({ resources });

test("Structure test", () => {
  const result = ijsn.t("a.b", {
    c: {
      d: "true",
      e: "50%"
    },
    f: {
      g: {
        toString: () => "<@1234567890>"
      }
    },
    h: "<@12345678901234567890>",
    i: 5000
  });

  assert.equal("a true b <@1234567890>, cde <@12345678901234567890> fg 50% hi 5000", result);
});

test("Function test", () => {
  const result = ijsn.t("function", {
    a: (b: string, c: string) => `Hello ${b}${c}`,
    b: "World",
    c: "!",
    d: (e: string) => e,
    e: (_: string, i: string) => "Hello World!" + i,
    f: { g: () => "Hello World!" },
    i: () => "hhhhh"
  });

  assert.equal("Hello World! Hello World!() => \"hhhhh\" () => \"Hello World!\"", result);
});

