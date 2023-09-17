import { Locale } from "discord.js";
import Translator from "../translator/src";
import resources from "./resources";

const Locales = Object.assign({}, Locale);

Translator.init({ resources, Locales, translation: { fallbackLocale: "pt-BR" } });

export default Translator;

export const t = Translator.t;