import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Resources } from "../translator/src";
import { mergeDefaults } from "./src/utils";

const localesPath = "locales";

const translations: Resources = {};

const langs = readdirSync(`${localesPath}`, { withFileTypes: true })
    .filter(f => f.isDirectory());

for (const langType of langs) {
    const lang = langType.name;

    const files = readdirSync(join(localesPath, lang));

    if (!files.length) continue;

    translations[lang] ??= {};

    for (const file of files) {
        try {
            const json = JSON.parse(readFileSync(join(localesPath, lang, file), "utf8"));

            mergeDefaults(json, translations[lang]);
        } catch (error) {
            console.error(error);
        }
    }
}

export default translations;