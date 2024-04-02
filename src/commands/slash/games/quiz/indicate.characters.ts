import { APIEmbed, APIMessage, ButtonStyle, ChatInputCommandInteraction, Colors, Routes, parseEmoji } from "discord.js";
import { e } from "../../../../util/json";
import Bytes from "../../util/bytes";
import { t } from "../../../../translator";
import { QuizCharactersManager } from "../../../../structures/quiz";
import client from "../../../../saphire";
import { Config } from "../../../../util/constants";
import { Character, LocalizationsKeys } from "../../../../@types/quiz";
import Database from "../../../../database";
import { writeFileSync } from "fs";
const preSending = new Map<string, string>();

export default async function indicate(interaction: ChatInputCommandInteraction) {

  const { options, userLocale: locale, user } = interaction;
  const image = options.getAttachment("image", true);

  if (
    !image.contentType?.startsWith("image")
    || image.contentType?.endsWith("gif")
  )
    return await interaction.reply({
      content: t("quiz.characters.invalid_format_image", { e, locale }),
      ephemeral: true
    });

  if (image.size > 8388608) // 8 MiB - Discord's API Limit Size
    return await interaction.reply({
      content: t("quiz.characters.image_over_size", {
        e,
        locale,
        source: `**${image.size} B** | **${new Bytes(image.size)}**`
      })
    });

  const keys = [
    "name",
    "artwork",
    "gender",
    "category",
    "another_names",
    "credits",
    "portuguese_name",
    "german_name",
    "english_name",
    "spanish_name",
    "french_name",
    "japanese_name",
    "chinese_name",
    "portuguese_artwork",
    "german_artwork",
    "english_artwork",
    "spanish_artwork",
    "french_artwork",
    "japanese_artwork",
    "chinese_artwork"
  ] as const;

  const data = keys.reduce<Record<(typeof keys)[number], string | null>>((pre, curr) => Object.assign(pre, { [curr]: options.getString(curr) }), {} as any);
  const character = QuizCharactersManager.exists([data.name!, data.artwork!]) || (preSending.get(data.name!)?.toLowerCase() === data.artwork?.toLowerCase());

  if (character)
    return await interaction.reply({
      content: t("quiz.characters.character_already_exists", { e, locale }),
      ephemeral: true
    });

  await interaction.reply({
    content: t("quiz.characters.sending_indication", { e, locale })
  });

  const inQueue = await Database.CharactersCache.exists({
    name: data.name!,
    artwork: data.artwork!
  });

  if (inQueue?._id)
    return await interaction.editReply({
      content: t("quiz.characters.character_already_exists_in_queue", { e, locale })
    });

  preSending.set(data.name!, data.artwork!);
  const attach = await fetch(image.url)
    .then(res => res.arrayBuffer())
    .then(Buffer.from);

  const gender = {
    male: "Masculino",
    female: "Feminino",
    others: "Outros"
  }[data.gender as Character["gender"]];

  const category = {
    anime: "Anime",
    movie: "Filme",
    game: "Jogo",
    serie: "Série",
    animation: "Animação",
    hq: "HQ"
  }[data.category as Character["category"]];

  const nameLocalizations: Character["nameLocalizations"] = {};
  const artworkLocalizations: Character["artworkLocalizations"] = {};

  const names = [
    {
      flag: "pt-BR",
      key: "portuguese_name"
    },
    {
      flag: "de",
      key: "german_name"
    },
    {
      flag: "en-US",
      key: "english_name"
    },
    {
      flag: "es-ES",
      key: "spanish_name"
    },
    {
      flag: "fr",
      key: "french_name"
    },
    {
      flag: "ja",
      key: "japanese_name"
    },
    {
      flag: "zh-CN",
      key: "chinese_name"
    }
  ]
    .map(({ flag, key }) => {
      const name = data[key as keyof typeof data];
      if (name) {
        nameLocalizations[flag as LocalizationsKeys] = name;
        return `${Config.flagLocales[flag as LocalizationsKeys]} ${name}`;
      }
      return;
    })
    .filter(Boolean)
    .join("\n")
    || "Nenhum nome informado";

  const artwork = [
    {
      flag: "pt-BR",
      key: "portuguese_artwork"
    },
    {
      flag: "de",
      key: "german_artwork"
    },
    {
      flag: "en-US",
      key: "english_artwork"
    },
    {
      flag: "es-ES",
      key: "spanish_artwork"
    },
    {
      flag: "fr",
      key: "french_artwork"
    },
    {
      flag: "ja",
      key: "japanese_artwork"
    },
    {
      flag: "zh-CN",
      key: "chinese_artwork"
    },
  ]
    .map(({ flag, key }) => {
      const name = data[key as keyof typeof data];
      if (name) {
        artworkLocalizations[flag as LocalizationsKeys] = name;
        return `${Config.flagLocales[flag as LocalizationsKeys]} ${name}`;
      }
    })
    .filter(Boolean)
    .join("\n")
    || "Nenhum nome informado";

  const credits = data.credits ? `\n[Créditos](${data.credits})` : "";
  const anotherAnswers = (data.another_names as any)?.split(",") || [];

  const embed: APIEmbed = {
    color: Colors.Blue,
    title: "🔎 Nova Sugestão de Personagem para o Quiz",
    description: `Nome: ${data.name}\nObra: ${data.artwork}\nGênero: ${gender}\nCategoria: ${category}${credits}`,
    fields: [
      {
        name: "📑 Outras Respostas",
        value: anotherAnswers?.map((str: string) => `\`${str}\``).join(", ") || "Nenhum outro nome fornecido"
      },
      {
        name: "🎌 Outros Nomes do Personagem",
        value: names
      },
      {
        name: "🎌 Outros Nomes da Obra",
        value: artwork
      }
    ],
    footer: {
      text: `${image.id}.png`
    },
    // image: {
    //   url: `attachment://${image.id}.png`
    // }
  };

  const save: Character = {
    id: "",
    name: data.name!,
    artwork: data.artwork!,
    artworkLocalizations,
    nameLocalizations,
    another_answers: anotherAnswers,
    gender: data.gender as Character["gender"],
    category: data.category as Character["category"],
    pathname: `${image.id}.png`,
    credits: data.credits!,
    authorId: user.id
  };

  if (interaction.channel?.isTextBased() && interaction.guild)
    save.channelId = interaction.channelId;

  if (!save.credits)
    delete save.credits;

  setTimeout(() => preSending.delete(data.name!), 5000);
  writeFileSync(`./src/temp/${save.pathname}`, attach);
  return await client.rest.post(
    Routes.channelMessages(Config.charactersQuizSuggestChannel),
    {
      body: {
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [{
              type: 3,
              custom_id: JSON.stringify({ c: "quiz", src: "edit" }),
              placeholder: "Editar informações da indicação",
              options: [
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
                }
              ]
            }]
          },
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "Aprovar",
                emoji: parseEmoji(e.CheckV),
                custom_id: JSON.stringify({ c: "quiz", src: "ind", type: "ok" }),
                style: ButtonStyle.Success
              },
              {
                type: 2,
                label: "Recusar",
                emoji: parseEmoji(e.DenyX),
                custom_id: JSON.stringify({ c: "quiz", src: "ind", type: "no" }),
                style: ButtonStyle.Danger
              }
            ]
          }
        ].asMessageComponents()
      }
    }
  )
    // return await client.channels.send(
    //   Config.charactersQuizSuggestChannel,
    //   {
    //     embeds: [embed],
    //     files: [],
    // components: [
    //   {
    //     type: 1,
    //     components: [{
    //       type: 3,
    //       custom_id: JSON.stringify({ c: "quiz", src: "edit" }),
    //       placeholder: "Editar informações da indicação",
    //       options: [
    //         {
    //           label: "Dados obrigatório",
    //           emoji: e.Warn,
    //           description: "Dados que não podem faltar",
    //           value: "base_data"
    //         },
    //         {
    //           label: "Outras respostas",
    //           emoji: "📑",
    //           description: "Outras respostas adicionais",
    //           value: "another_answers"
    //         },
    //         {
    //           label: "Mudar nomes de Traduções",
    //           emoji: e.Translate,
    //           description: "Nomes e traduções de personagem e obra",
    //           value: "language"
    //         }
    //       ]
    //     }]
    //   },
    //   {
    //     type: 1,
    //     components: [
    //       {
    //         type: 2,
    //         label: "Aprovar",
    //         emoji: e.CheckV,
    //         custom_id: JSON.stringify({ c: "quiz", src: "ind", type: "ok" }),
    //         style: ButtonStyle.Success
    //       },
    //       {
    //         type: 2,
    //         label: "Recusar",
    //         emoji: e.DenyX,
    //         custom_id: JSON.stringify({ c: "quiz", src: "ind", type: "no" }),
    //         style: ButtonStyle.Danger
    //       }
    //     ]
    //   }
    // ].asMessageComponents()
    //   }
    // )
    .then(async (res) => {

      const message = res as APIMessage;

      if (message.id) {
        save.id = message.id;
        await Database.CharactersCache.create(save);
        return await interaction.editReply({
          content: t("quiz.characters.sendded", { e, locale })
        }).catch(() => { });
      }
      QuizCharactersManager.removeImageFromTempFolder(`./src/temp/${save.pathname}`);
      return await interaction.editReply({
        content: t("quiz.characters.error_to_send", { e, locale, err: "No message origin found" })
      }).catch(() => { });
      // if (res.error) console.log(res.error);
      // if (res?.success && res.message?.id) {
      //   save.id = res.message.id;
      //   await Database.CharactersCache.create(save);

      //   return await interaction.editReply({
      //     content: t("quiz.characters.sendded", { e, locale })
      //   }).catch(() => { });
      // }

      // QuizCharactersManager.removeImageFromTempFolder(`./src/temp/${save.pathname}`);
      // return await interaction.editReply({
      //   content: t("quiz.characters.error_to_send", { e, locale, err: res.error })
      // }).catch(() => { });
    })
    .catch(async err => {
      console.log(err);
      QuizCharactersManager.removeImageFromTempFolder(`./src/temp/${save.pathname}`);
      return await interaction.editReply({
        content: t("quiz.characters.error_to_send", { e, locale, err })
      }).catch(() => { });
    });

}