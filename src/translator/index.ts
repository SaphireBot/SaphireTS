import { Locale } from "discord.js";
import Translator from "./src";
import resources from "./resources";

const Locales = Object.assign({}, Locale);
Translator.init({ resources, Locales, translation: { fallbackLocale: "en-US" } });

export default Translator;

export const t = Translator.t;