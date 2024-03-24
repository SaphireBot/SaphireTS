import { AutocompleteInteraction, LocaleString } from "discord.js";
import handler from "../../commands/handler";
const options = [] as { name: string, value: string, aliases: string[], descriptions: string[] }[];

export default async function command(interaction: AutocompleteInteraction, value?: string) {

  if (!options.length)
    defineOptions(interaction.userLocale);

  const val = value?.toLowerCase() || "";

  const data = options
    .filter(opt => opt.name?.toLowerCase()?.includes(val)
      || opt.value.includes(val)
      || opt.aliases.some(alias => alias?.includes(val))
      || opt.descriptions.some(desc => desc?.includes(val))
    )
    .slice(0, 25);

  return await interaction.respond(data);
}

function defineOptions(locale: LocaleString) {

  for (const cmd of handler.allCommands) {

    const slash = handler.getSlashCommand(cmd)!;
    const prefix = handler.getPrefixCommand(cmd)!;
    const context = handler.getContextMenuCommand(cmd)!;
    const tags = [] as string[];

    if (context) tags.push("apps");

    const descriptions: string[] = [];

    if (slash) {
      descriptions.push(slash.data.description);
      const values = Object.values(slash?.data?.description_localizations as Record<string, string> || {});
      descriptions.push(...values);
      tags.push("slash");
    }

    if (prefix) {
      descriptions.push(prefix.description);
      tags.push("prefix");
    }

    const name = `[${tags.join(" | ")}] ${slash?.data?.name_localizations?.[locale] || cmd}`;

    options.push({
      name,
      value: cmd,
      aliases: prefix?.aliases || [],
      descriptions: descriptions.filter(Boolean)
    });

  }

}