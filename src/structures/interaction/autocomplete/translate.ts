import { AutocompleteInteraction } from "discord.js";
import { languages } from "../../../commands/prefix/util/translate/constants.translate";
import translate from "google-translate-api-x";

let loading = false;
const langs = new Map<string, [string, string][]>();

export default async function translateAutocompleteLangs(interaction: AutocompleteInteraction, value: string = "") {

  if (!langs.size) return await loadTranslateAutocompleteLangs();

  const { userLocale: locale } = interaction;
  const lang = langs.get(locale) || langs.get("en-US");

  if (!lang) return await loadTranslateAutocompleteLangs();

  value = value.toLowerCase();
  return await interaction.respond(
    lang
      .filter(([k, v]) => v.toLowerCase().includes(value) || k.includes(value))
      .map(([k, v]) => ({
        name: `[${k}] ${v}`,
        value: k,
      }))
      .slice(0, 25));
}

export async function loadTranslateAutocompleteLangs() {

  if (loading) return;
  loading = true;

  const isos = ["pt-BR", "de", "es-ES", "ja", "zh-CN", "fr"];

  const res = await Promise.all(isos.map(iso => translate(languages, {
    to: languages[iso as keyof typeof languages],
    rejectOnPartialFail: false,
    forceBatch: false,
  })))
    .catch(err => {
      console.log(err);
      loading = false;
      setTimeout(() => loadTranslateAutocompleteLangs(), 1000 * 10);
      return null;
    });

  if (!res) return;

  langs.set("en-US", Object.entries(languages));

  isos.map((iso, i) => {
    const rec: Record<string, string> = {};
    for (const [key, value] of Object.entries(res[i]))
      if (value?.text) rec[key] = value.text;

    langs.set(iso, Object.entries(rec));
  });
  loading = false;
  // TODO: Remove it when two or more shards is spawning
  console.log(langs.size, "langs in Translate Autocomplete loaded");
  return;
}