import { APIEmbedField, AttachmentBuilder, Colors, LocaleString, parseEmoji } from "discord.js";
import { Character, LocalizationsKeys } from "../../../../../@types/quiz";
import { Config, buttonsPagination } from "../../../../../util/constants";
import { e } from "../../../../../util/json";
import { t } from "../../../../../translator";
import { QuizCharactersManager } from "../../../../../structures/quiz";
import client from "../../../../../saphire";
import { readFileSync } from "fs";

export default async function buildEmbed(character: Character, userId: string, locale: LocaleString) {

  const fields: APIEmbedField[] = [];
  const author = character.authorId ? await client.users.fetch(character.authorId).catch(() => null) : null;

  if (character.nameLocalizations)
    fields.push({
      name: t("quiz.characters.viewer.embed.nameLocalizations", { e, locale }),
      value: Object.entries(character?.nameLocalizations || [])
        .map(([locale, value]) => {
          if (!value) return;
          return `${Config.flagLocales[locale as LocalizationsKeys]} ${value}`;
        })
        .filter(Boolean)
        .join("\n")
        || t("quiz.characters.viewer.embed.no_name", locale)
    });

  if (character.artworkLocalizations)
    fields.push({
      name: t("quiz.characters.viewer.embed.artworkLocalizations", { e, locale }),
      value: Object.entries(character?.artworkLocalizations || [])
        .map(([locale, value]) => {
          if (!value) return;
          return `${Config.flagLocales[locale as LocalizationsKeys]} ${value}`;
        })
        .filter(Boolean)
        .join("\n")
        || t("quiz.characters.viewer.embed.no_name", locale)
    });

  if (character.another_answers?.length)
    fields.push({
      name: t("quiz.characters.viewer.embed.alternative_answers", locale),
      value: character.another_answers.map(str => `\`${str}\``).join(", ") || t("quiz.characters.viewer.embed.no_name", locale)
    });

  if (character.credits)
    fields.push({
      name: t("quiz.characters.viewer.embed.credits", locale),
      value: character.credits.isURL()
        ? t("quiz.characters.viewer.embed.click_for_more_information", { locale, link: character.credits })
        : character.credits
    });

  if (fields.length)
    for (const { value } of fields)
      value.limit("EmbedFieldValue") + "\n ";

  const url = QuizCharactersManager.url(character);
  const files = [] as any[];
  let description = "";

  if (author?.username)
    description += `📨 ${author.username} \`${author.id}\`\n`;

  description += `👤 ${character.name}\n🎬 ${character.artwork}\n`;
  description += `${e.QuizCharacters[character.category as keyof typeof e.QuizCharacters] || "⭐"} ${t(`quiz.characters.names.${character.category}`, locale)}\n`;
  description += `${e[character.gender as keyof typeof e] || "❔"} ${t(`quiz.characters.names.${character.gender}`, locale)}\n`;
  description += `🆔 \`${character.id}\``;

  if (url.includes("attachment://")) {
    const image = readFileSync(`./temp/characters/${character.pathname}`);
    if (image)
      files.push(
        new AttachmentBuilder(
          image,
          {
            name: character.pathname,
            description: character.name
          }
        )
      );
  }

  const fromTempFile = url.includes("attachment://");
  if (fromTempFile)
    description += `\n${t("quiz.characters.character_not_approved_yet", { e, locale })}`;

  const options = [
    {
      label: "Dados obrigatório",
      emoji: parseEmoji(e.Warn),
      description: "Dados que não podem faltar",
      value: "base_data"
    },
    {
      label: "Outras respostas",
      emoji: parseEmoji("📑"),
      description: "Outras respostas adicionais",
      value: "another_answers"
    },
    {
      label: "Mudar nomes de Traduções",
      emoji: parseEmoji(e.Translate),
      description: "Nomes e traduções de personagem e obra",
      value: "language"
    },
    {
      label: "Excluir",
      emoji: parseEmoji(e.Trash),
      description: "Excluir personagem do banco de dados",
      value: "delete"
    },
    {
      label: "Reportar",
      emoji: parseEmoji(e.Sirene),
      description: "Reporte algo errado que você encontrou",
      value: "report"
    }
  ]
    .filter(opt => {
      if (fromTempFile) return false;
      return QuizCharactersManager.isStaff(userId)
        || ["report", "refresh"].includes(opt?.value);
    });

  return {
    embeds: [{
      color: Colors.Blue,
      title: t("quiz.characters.viewer.embed.title", {
        e,
        locale
      }),
      description: description.trim(),
      fields,
      image: { url },
      footer: {
        text: url,
        icon_url: "https://cdn.icon-icons.com/icons2/2699/PNG/512/cloudflare_logo_icon_170372.png"
      }
    }],
    files,
    components: [
      {
        type: 1,
        components: [{
          type: 3,
          custom_id: JSON.stringify({ c: "quiz", src: "view", path: character.pathname }),
          placeholder: "Configurações",
          options: [
            ...options,
            {
              label: "Atualizar",
              emoji: parseEmoji("🔄"),
              description: "Atualize a embed se algo não faz sentido",
              value: "refresh"
            }
          ]
        }]
      },
      buttonsPagination
    ]
  };

}
