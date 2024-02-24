import { ButtonStyle, LocaleString, APIEmbed } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default function payload(locale: LocaleString, userId: string, raw?: APIEmbed) {

  const embed: APIEmbed = {
    color: raw?.color,
    author: raw?.author?.name || raw?.author?.icon_url
      ? {
        name: raw.author.name,
        icon_url: raw?.author?.icon_url,
        url: raw?.author?.url
      }
      : undefined,
    url: raw?.url,
    title: raw?.title,
    thumbnail: raw?.thumbnail?.url
      ? { url: raw?.thumbnail?.url }
      : undefined,
    description: raw?.description,
    fields: raw?.fields,
    image: raw?.image?.url
      ? { url: raw.image.url }
      : undefined,
    footer: raw?.footer?.text || raw?.footer?.icon_url
      ? {
        text: raw?.footer?.text,
        icon_url: raw?.footer?.icon_url
      }
      : undefined,
    timestamp: raw?.timestamp,
  };

  if (Array.isArray(embed.fields))
    if (embed.fields.length > 25)
      embed.fields!.length = 25;
    else if (embed.fields.length === 0)
      delete embed.fields;

  if (
    !embed.title
    && !embed.description
    && !embed.author?.name
    && (
      embed.color
      || embed.timestamp
    )
  ) {
    delete embed.color;
    delete embed.timestamp;
  }

  const hasEmbedData = Object.values(embed).filter(Boolean).length;
  const components = [] as any;

  components.push(
    {
      type: 1,
      components: [
        {
          type: 2,
          label: t("embed.components.buttons.0", locale).limit("ButtonLabel"),
          emoji: "📝",
          custom_id: JSON.stringify({ c: "embed", src: "body", uid: userId }),
          style: ButtonStyle.Primary
        },
        {
          type: 2,
          label: t("embed.components.buttons.1", locale),
          emoji: "🔗",
          custom_id: JSON.stringify({ c: "embed", src: "links", uid: userId }),
          style: ButtonStyle.Primary
        },
        {
          type: 2,
          label: t("embed.components.buttons.2", { locale, fields: embed.fields?.length || 0 }),
          emoji: e.plus,
          custom_id: JSON.stringify({ c: "embed", src: "add_fields", uid: userId }),
          style: ButtonStyle.Primary,
          disabled: (embed.fields?.length || 0) >= 25
        },
        {
          type: 2,
          label: t("embed.components.buttons.3", locale),
          emoji: "🧩",
          custom_id: JSON.stringify({ c: "embed", src: "footer", uid: userId }),
          style: ButtonStyle.Primary
        },
        {
          type: 2,
          label: t("embed.components.buttons.4", locale),
          emoji: "⏰",
          custom_id: JSON.stringify({ c: "embed", src: "timestamp", uid: userId }),
          style: ButtonStyle.Primary,
          disabled: !embed.description && !embed.title && !embed.author?.name && !embed.image?.url
        }
      ]
    }
  );

  if (embed.fields?.length)
    components.push({
      type: 1,
      components: [{
        type: 3,
        custom_id: JSON.stringify({ c: "embed", src: "fields", uid: userId }),
        placeholder: t("embed.components.select_menu.fields.placeholder", locale),
        options: embed.fields
          .map((field, index) => ({
            label: field.name.limit("SelectMenuLabel"),
            description: field.value.limit("SelectMenuDescription"),
            value: `${index}`
          }))
          .slice(0, 25)
      }]
    });

  components.push({
    type: 1,
    components: [{
      type: 3,
      custom_id: JSON.stringify({ c: "embed", src: "options", uid: userId }),
      placeholder: t("embed.components.select_menu.config.placeholder", locale),
      options: [
        {
          emoji: "🎨",
          label: t("embed.components.select_menu.config.options.5.label", locale),
          description: t("embed.components.select_menu.config.options.5.description", locale),
          value: "color"
        },
        {
          emoji: "📨",
          label: t("embed.components.select_menu.config.options.0.label", locale),
          description: t("embed.components.select_menu.config.options.0.description", locale),
          value: "choose_channel"
        },
        {
          emoji: "⚙️",
          label: t("embed.components.select_menu.config.options.1.label", locale),
          description: t("embed.components.select_menu.config.options.1.description", locale),
          value: "webhook"
        },
        {
          emoji: "⬆️",
          label: t("embed.components.select_menu.config.options.2.label", locale),
          description: t("embed.components.select_menu.config.options.2.description", locale),
          value: "json_up"
        },
        {
          emoji: "⬇️",
          label: t("embed.components.select_menu.config.options.3.label", locale),
          description: t("embed.components.select_menu.config.options.3.description", locale),
          value: "json_down"
        },
        {
          emoji: e.Download,
          label: t("embed.components.select_menu.config.options.4.label", locale),
          description: t("embed.components.select_menu.config.options.4.description", locale),
          value: "message_link"
        },

        {
          emoji: e.Trash,
          label: t("embed.components.select_menu.config.options.6.label", locale),
          description: t("embed.components.select_menu.config.options.6.description", locale),
          value: "delete"
        }
      ]
    }]
  });

  return {
    content: hasEmbedData ? null : t("embed.no_embed", { locale: locale, e }),
    embeds: hasEmbedData ? [embed] : [],
    components,
    fetchReply: true
  } as any;
}