import assert from "node:assert";
import test from "node:test";
import Ijsn from "../Ijsn";

const ijsn = new Ijsn();

test("Missing key", () => {
  assert.equal(ijsn.translator.translate("key", {}), "key");
});

test("Return null at missing key", () => {
  assert.strictEqual(ijsn.translator.translate("key", { translation: { returnNull: true } }), null);
});

test("Default key to value", () => {
  ijsn.init({
    resources: {
      en: {
        key: "value"
      }
    }
  });

  assert.strictEqual(ijsn.translator.translate("key", {}), "value");
});

test("Object to value", () => {
  ijsn.init({
    resources: {
      en: {
        key1: {
          key2: "value"
        }
      }
    }
  });

  assert.strictEqual(ijsn.translator.translate("key1.key2", {}), "value");
});

test("Array to value", () => {
  ijsn.init({
    resources: {
      en: {
        keys: [
          "value"
        ]
      }
    }
  });

  assert.strictEqual(ijsn.translator.translate("keys.0", {}), "value");
});

test("Fallback locale pt", () => {
  ijsn.init({
    resources: {
      pt: {
        key: "valor"
      }
    },
    translation: {
      fallbackLocale: "pt"
    }
  });

  assert.strictEqual(ijsn.translator.translate("key", {}), "valor");
});

test("Translate to other locale", () => {
  ijsn.init({
    resources: {
      es: {
        key: "value"
      }
    }
  });

  assert.strictEqual(ijsn.translator.translate("key", { locale: "es" }), "value");
});

test("Basic pluralize", () => {
  ijsn.init({
    resources: {
      en: {
        key_other: "value"
      }
    }
  });

  assert.strictEqual(ijsn.translator.translate("key", { count: 100 }), "value");
});

test("Object pluralize", () => {
  ijsn.init({
    resources: {
      en: {
        key: {
          other: "value"
        }
      }
    }
  });

  assert.strictEqual(ijsn.translator.translate("key", { count: 100, translation: { pluralSeparator: "." } }), "value");
});
