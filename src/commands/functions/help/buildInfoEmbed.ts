import { APIEmbed, Colors, LocaleString } from "discord.js";
import handler from "../../../structures/commands/handler";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default function getCommandEmbed(commandName: string, locale: LocaleString, prefixes: string[]) {

  const prefix = handler.getPrefixCommand(commandName);
  const slash = handler.getSlashCommand(prefix?.name || commandName);
  const context = handler.getContextMenuCommand(prefix?.name || commandName);
  const embeds: APIEmbed[] = [];

  const flags = {
    "en-US": "🇺🇸",
    "zh-CN": "🇨🇳",
    "fr": "🇫🇷",
    "de": "🇩🇪",
    "ja": "🇯🇵",
    "pt-BR": "🇧🇷",
    "es-ES": "🇪🇸",
  };

  if (slash) {
    const userPerm = slash.additional.api_data.perms?.user;
    const botPerm = slash.additional.api_data.perms?.bot;
    embeds.push({
      color: Colors.Blue,
      title: t("help.info.embeds.slash_title", { e, locale, command: slash.data.name_localized || slash.data.name_localizations?.[locale] || slash.data.name }),
      description: t("help.info.embeds.slash_description", {
        e,
        locale,
        global: slash.data.contexts?.length ? e.CheckV : e.DenyX,
        nsfw: slash.data.nsfw ? e.CheckV : e.DenyX,
        dm: slash.data.dm_permission ? e.CheckV : e.DenyX,
        category: slash.additional.category,
        staff: (slash.additional.admin || slash.additional.staff) ? e.CheckV : e.DenyX
      }),
      fields: [
        {
          name: t("help.info.embeds.name", locale),
          value: t("help.info.embeds.names", {
            locale,
            original: slash.data.name,
            localizations: Object
              .entries(slash.data.name_localizations || {})
              .map(([lang, name]) => `${flags[lang as keyof typeof flags]} \`${name || slash.data.name}\``)
              .join("\n")
          }).limit("EmbedFieldValue")
        },
        {
          name: t("help.info.embeds.description", locale),
          value: t("help.info.embeds.descriptions", {
            locale,
            original: slash.data.description,
            localizations: Object
              .entries(slash.data.description_localizations || {})
              .map(([lang, desc]) => `${flags[lang as keyof typeof flags]} \`${desc || slash.data.description}\``)
              .join("\n")
          }).limit("EmbedFieldValue")
        },
        {
          name: t("help.info.embeds.options", locale),
          value: slash.data.options?.length
            ? slash.data.options
              .map(option => `${option.name_localizations?.[locale] || option.name}: \`${option.description_localizations?.[locale] || option.description}\``)
              .join("\n")
              .limit("EmbedFieldValue")
            : t("help.info.embeds.no_options", locale)
        },
        {
          name: t("help.info.embeds.permissions", locale),
          value: (userPerm.length || botPerm.length)
            ? t("help.info.embeds.value_permissions", {
              locale,
              user: userPerm.length
                ? userPerm.map(perm => `\`${t(`Discord.Permissions.${perm}`, locale)}\``).join(", ")
                : t("help.info.embeds.no_permissions", locale),
              bot: botPerm.length
                ? botPerm.map(perm => `\`${t(`Discord.Permissions.${perm}`, locale)}\``).join(", ")
                : t("help.info.embeds.no_permissions", locale)
            }).limit("EmbedFieldValue")
            : t("help.info.embeds.no_permissions", locale)
        }
      ]
    });
  }

  if (prefix)
    embeds.push({
      color: Colors.Blue,
      title: t("help.info.embeds.prefix_title", { e, locale, command: prefix.name, prefix: prefixes.random() }),
      description: prefix.description,
      fields: [
        {
          name: t("help.info.embeds.aliases_name", locale),
          value: prefix.aliases?.length
            ? prefix.aliases.map(alias => `\`${alias}\``)
              .join(", ")
              .limit("EmbedFieldValue")
            : t("help.info.embeds.no_aliases", locale)
        },
        {
          name: t("help.info.embeds.prefixes", locale),
          value: prefixes.map(prefix => `\`${prefix}\``).join(", "),
        }
      ]
    });

  if (context) {
    const userPerm = context.additional.api_data.perms?.user;
    const botPerm = context.additional.api_data.perms?.bot;
    embeds.push({
      color: Colors.Blue,
      title: t("help.info.embeds.context_title", { locale, command: context.data.name_localizations?.[locale] || context.data.name }),
      description: t("help.info.embeds.context_description", {
        e,
        locale,
        global: context.data.contexts?.length ? e.CheckV : e.DenyX,
        nsfw: context.data.nsfw ? e.CheckV : e.DenyX,
        dm: context.data.dm_permission ? e.CheckV : e.DenyX,
        category: context.additional.category,
        staff: (context.additional.admin || context.additional.staff) ? e.CheckV : e.DenyX
      }),
      fields: [
        {
          name: t("help.info.embeds.name", locale),
          value: t("help.info.embeds.names", {
            locale,
            original: context.data.name,
            localizations: Object
              .entries(context.data.name_localizations || {})
              .map(([lang, name]) => `${flags[lang as keyof typeof flags]} \`${name || context.data.name}\``)
              .join("\n")
          }).limit("EmbedFieldValue")
        },
        {
          name: t("help.info.embeds.permissions", locale),
          value: (userPerm.length || botPerm.length)
            ? t("help.info.embeds.value_permissions", {
              locale,
              user: userPerm.length
                ? userPerm.map(perm => `\`${t(`Discord.Permissions.${perm}`, locale)}\``).join(", ")
                : t("help.info.embeds.no_permissions", locale),
              bot: botPerm.length
                ? botPerm.map(perm => `\`${t(`Discord.Permissions.${perm}`, locale)}\``).join(", ")
                : t("help.info.embeds.no_permissions", locale)
            }).limit("EmbedFieldValue")
            : t("help.info.embeds.no_permissions", locale)
        }
      ]
    });
  }
  return embeds;
}