import { AutocompleteInteraction } from "discord.js";
import { languages } from "../../../commands/prefix/util/translate/constants.translate";
import translate from "google-translate-api-x";

let loading = false;
const langs = new Map<string, [string, string][]>();
loadLangs();

export default async function translateAutocompleteLangs(interaction: AutocompleteInteraction, value: string = "") {

  if (!langs.size) return await loadLangs();

  const { userLocale: locale } = interaction;
  const lang = langs.get(locale) || langs.get("en-US");

  if (!lang) return await loadLangs();

  value = value.toLowerCase();
  return await interaction.respond(lang
    .filter(([k, v]) => v.toLowerCase().includes(value) || k.includes(value))
    .map(([k, v]) => ({
      name: `[${k}] ${v}`,
      value: k,
    }))
    .slice(0, 25));
}

async function loadLangs() {

  if (loading) return;
  loading = true;

  const isos = ["pt-BR", "de", "es-ES", "ja", "zh-CN", "fr"];

  const res = await Promise.all(isos.map(iso => translate(languages, { to: languages[iso as keyof typeof languages] })))
    .catch(() => {
      setTimeout(() => loadLangs(), 1000 * 10);
      return null;
    });

  if (!res) return;

  langs.set("en-US", Object.entries(languages));

  isos.map((iso, i) => {
    const rec: Record<string, string> = {};
    for (const [key, value] of Object.entries(res[i]))
      rec[key] = value.text;

    langs.set(iso, Object.entries(rec));
  });
  loading = false;
}