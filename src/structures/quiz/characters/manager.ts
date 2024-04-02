import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Message, ModalSubmitInteraction, Routes } from "discord.js";
import { Character, LocalizationsKeys } from "../../../@types/quiz";
import { Config, StaffsIDs } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { existsSync, writeFileSync, readFileSync, rmSync } from "fs";
import Database from "../../../database";
import { CharacterSchemaType } from "../../../database/schemas/character";
import modals from "./modal/modals";
import client from "../../../saphire";

export default class QuizCharacters {

  characters = new Collection<string, Character>();
  categories = ["anime", "movie", "game", "serie", "animation", "hq"];
  genders = ["male", "female", "others"];
  staff = [StaffsIDs.San, StaffsIDs.Rody];

  constructor() { }

  async load() {

    const characters = await Database.Characters.find()
      .then(characters => characters.map(character => character.toObject()));

    for (const character of characters)
      this.characters.set(character.id, character);

    return;
  }

  get allCharactersToBeAdded() {
    return JSON.parse(readFileSync("./src/temp/characters/data.json", { encoding: "utf-8" }) || "[]") as Character[];
  }

  async getCharacterBy(id: string) {
    return this.characters.get(id) || await Database.Characters.findOne({ id })?.then(res => res?.toObject());
  }

  async getCharacterPathname(pathname: string) {
    return this.characters.find(ch => ch.pathname === pathname)
      || await Database.Characters.findOne({ pathname })?.then(res => res?.toObject());
  }

  async getCharacterFromCache(pathname: string) {
    return await Database.CharactersCache.findOne({ pathname })?.then(res => res?.toObject());
  }

  search(queries: string[]) {
    const query = new Set(queries.map(str => str.toLowerCase()));
    return this.characters.find(character => {
      return query.has(character.id!)
        || (query.has(character.name.toLowerCase()) && query.has(character.artwork.toLowerCase()))
        || query.has(character.pathname);
    }) || this.allCharactersToBeAdded.find(character => {
      return query.has(character.id!)
        || (query.has(character.name.toLowerCase()) && query.has(character.artwork.toLowerCase()))
        || query.has(character.pathname);
    });
  }

  exists(queries: string[]) {
    const query = new Set(queries.map(str => str.toLowerCase()));
    return this.characters.some(character => {
      return query.has(character.id!)
        || (query.has(character.name.toLowerCase()) && query.has(character.artwork.toLowerCase()))
        || query.has(character.pathname);
    }) || this.allCharactersToBeAdded.some(character => {
      return query.has(character.id!)
        || (query.has(character.name.toLowerCase()) && query.has(character.artwork.toLowerCase()))
        || query.has(character.pathname);
    });
  }

  async saveOrDeleteNewCharacter(interaction: ButtonInteraction<"cached">, data: { c: "quiz", src: "ind", type: "ok" | "no" }) {

    const { user, userLocale: locale, message } = interaction;

    if (!this.staff.includes(user.id))
      return await interaction.reply({
        content: t("quiz.characters.staff_only", { e, locale }),
        ephemeral: true
      });

    if (message.partial) await message.fetch()?.catch(() => null);

    if (!data?.type) {
      await interaction.update({
        content: `${e.DenyX} | CustomID do botão estão indefinidos.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: []
      }).catch(() => { });
      return setTimeout(async () => await message.delete().catch(() => { }), 5000);
    }

    const embed = message.embeds?.[0]?.data;
    const id = embed?.footer?.text?.replace(".png", "");
    const imageUrl = embed?.image?.url;

    if (!id || !imageUrl) {
      await interaction.update({
        content: `${e.DenyX} | ImageURL ou ID não foram encontrados.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: []
      }).catch(() => { });
      return setTimeout(async () => await message.delete().catch(() => { }), 5000);
    }

    const character = await Database.CharactersCache.findOne({ pathname: `${id}.png` });

    if (!character) {
      await interaction.update({
        content: `${e.DenyX} | Personagem não encontrado no banco de dados.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: []
      }).catch(() => { });
      return await QuizCharacters.cancelRequest(message, id);
    }

    if (data?.type === "no") {
      this.notifyUserStatus(
        "quiz.characters.notify_denied",
        character
      );
      await message.delete()?.catch(() => { });
      return await QuizCharacters.removeDataFromDatabase(`${id}.png`);
    }

    if (this.exists([character.name, character.artwork])) {
      await interaction.update({
        content: `${e.DenyX} | Esse personagem já está registrado no banco de dados.`,
        embeds: [],
        components: [],
        files: []
      }).catch(() => { });
      return await QuizCharacters.cancelRequest(message, id);
    }

    await interaction.update({
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: "Salvando...",
              emoji: e.Loading,
              custom_id: "loading",
              style: ButtonStyle.Primary,
              disabled: true
            }
          ]
        }
      ].asMessageComponents()
    });

    const path = `./src/temp/characters/${id}.png`;
    const saveImage = await this.saveImage(imageUrl, path);

    if (saveImage !== true) {
      await interaction.editReply({
        content: `${e.DenyX} | Falha ao salvar imagem no cache.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: []
      }).catch(() => { });
      return await QuizCharacters.cancelRequest(message, id);
    }

    const exists = existsSync(path);
    if (!exists) {
      await interaction.editReply({
        content: `${e.DenyX} | Não foi possível encontrar a imagem salvada.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: []
      }).catch(() => { });
      return await QuizCharacters.cancelRequest(message, id);
    }

    const cache = QuizCharacters.addDataToTempJSON(character.toJSON());
    if (cache !== true) {
      await interaction.editReply({
        content: `${e.DenyX} | Falha ao salvar documento no cache.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: []
      }).catch(() => { });
      return await QuizCharacters.cancelRequest(message, id);
    }

    this.notifyUserStatus(
      "quiz.characters.notify_approved",
      character
    );

    await interaction.editReply({
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: "Salvo com sucesso",
              emoji: e.CheckV,
              custom_id: "success",
              style: ButtonStyle.Success,
              disabled: true
            }
          ]
        }
      ].asMessageComponents()
    }).catch(() => { });
    return await QuizCharacters.cancelRequest(message, id);
  }

  async notifyUserStatus(
    contentKey: "quiz.characters.notify_approved" | "quiz.characters.notify_denied",
    character: Character
  ) {
    if (!contentKey || !character.channelId || !character.authorId) return;
    const locale = (await Database.getUser(character.authorId))?.locale;
    await client.rest.post(
      Routes.channelMessages(character.channelId),
      {
        body: {
          content: t(contentKey, {
            e,
            locale,
            authorId: character.authorId,
            name: character.name,
            category: t(`quiz.characters.names.${character.category}`, locale)
          })
        }
      }
    )
      .catch(() => { });
  }

  static async cancelRequest(message: Message<true>, id: string) {
    await this.removeDataFromDatabase(`${id}.png`);
    return setTimeout(async () => await message.delete().catch(() => { }), 3000);
  }

  async redirectFunctionByCustomID(interaction: ButtonInteraction<"cached"> | ModalSubmitInteraction<"cached">, data: { c: "quiz", src: "ind" }) {

    if (interaction instanceof ModalSubmitInteraction)
      return await modals(interaction, data as any);

    if (data?.src === "ind")
      return this.saveOrDeleteNewCharacter(interaction, data as any);

    return await interaction.reply({
      content: t("quiz.characters.no_custom_data", { e, locale: interaction.userLocale }),
      ephemeral: true
    });
  }

  async saveImage(url: string, path: string): Promise<true | Error> {
    try {
      const buffer = await fetch(url)
        .then(res => res.arrayBuffer())
        .then(Buffer.from);
      writeFileSync(path, buffer);
      return true;
    } catch (err) {
      return err as Error;
    }
  }

  static addDataToTempJSON(character: CharacterSchemaType): true | Error {

    try {

      const json = JSON.parse(readFileSync("./src/temp/characters/data.json", { encoding: "utf-8" }) || "[]") as Character[];

      const CharacterDataJSON: Character = {
        nameLocalizations: {},
        artworkLocalizations: {},
        id: character._id.toString(),
        name: character.name,
        artwork: character.artwork,
        another_answers: character.another_answers,
        gender: character.gender,
        category: character.category,
        pathname: character.pathname
      };

      if (character.credits)
        CharacterDataJSON.credits = character.credits;

      for (const lang of Object.keys(character.nameLocalizations || {}) as LocalizationsKeys[])
        if (character?.nameLocalizations?.[lang])
          CharacterDataJSON.nameLocalizations[lang] = character.nameLocalizations[lang];

      for (const lang of Object.keys(character.artworkLocalizations || {}) as LocalizationsKeys[])
        if (character?.artworkLocalizations?.[lang])
          CharacterDataJSON.artworkLocalizations[lang] = character.artworkLocalizations[lang];

      json.push(CharacterDataJSON);

      writeFileSync(
        "./src/temp/characters/data.json",
        JSON.stringify(json, null, 4),
        { encoding: "utf-8" }
      );

      return true;
    } catch (err) {
      return err as Error;
    }

  }

  static async removeDataFromDatabase(pathname: string) {
    return await Database.CharactersCache.deleteOne({ pathname });
  }

  async removeFromCache(messagesId: string[]) {
    if (!messagesId) return;
    return await Database.CharactersCache.deleteMany({ id: { $in: messagesId } });
  }

  async removeFromCacheByMessageId(messageId: string) {
    await Database.CharactersCache.deleteOne({ id: messageId });
  }

  async setCharactersToDatabase(interaction: ChatInputCommandInteraction | Message) {

    const { userLocale: locale } = interaction;
    const user = interaction instanceof ChatInputCommandInteraction ? interaction.user : interaction.author;

    if (user.id !== Config.ownerId)
      return await interaction.reply({
        content: t("quiz.characters.you_cannot_use_this_command", { e, locale }),
        ephemeral: interaction instanceof ChatInputCommandInteraction
      });

    const charactersApproved = JSON.parse(readFileSync("./src/temp/characters/data.json", { encoding: "utf-8" }) || "[]") as Character[];

    if (!charactersApproved?.length)
      return await interaction.reply({
        content: `${e.DenyX} | A lista de personagens aprovados está vázia.`
      });

    const msg = await interaction.reply({
      content: `${e.Loading} | Transferindo ${charactersApproved.length} personagens para o banco de dados oficial...`,
      fetchReply: interaction instanceof ChatInputCommandInteraction
    });

    await sleep(3000);

    return await Database.Characters.create(charactersApproved)
      .then(async data => {

        for (const character of data) {
          // @ts-expect-error ignore
          delete character._id;
          // @ts-expect-error ignore
          delete character.__V;
          this.characters.set(character.id, character);
        }

        const payload = {
          content: `${e.CheckV} | ${charactersApproved.length} personagens foram transferidos para o banco de dados oficial e configurados no Quiz principal..`
        };

        try {
          writeFileSync(
            "./src/temp/characters/data.json",
            JSON.stringify([], null, 4),
            { encoding: "utf-8" }
          );
          if (interaction instanceof ChatInputCommandInteraction)
            return await interaction.editReply(payload).catch(() => { });
          return await msg.edit(payload).catch(() => { });
        } catch (err) {
          const payload = {
            content: `${e.DenyX} | Houve um erro na transferência de personagens para o banco de dados principal.\n${e.bug} | \`${err}\``
          };
          if (interaction instanceof ChatInputCommandInteraction)
            return await interaction.editReply(payload).catch(() => { });
          return await msg.edit(payload).catch(() => { });
        }

      })
      .catch(async err => {

        const payload = {
          content: `${e.DenyX} | Houve um erro na transferência de personagens para o banco de dados principal.\n${e.bug} | \`${err}\``
        };

        if (interaction instanceof ChatInputCommandInteraction)
          return await interaction.editReply(payload);
        return await msg.edit(payload);
      });
  }

  removeImageFromTempFolder(pathname: string): boolean {
    try {
      if (!existsSync(pathname)) return false;
      rmSync(pathname);
      return true;
    } catch (err) {
      return false;
    }
  }

  buildTranslateSelectMenu(character: Character) {

    const options = [] as any[];

    [
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
      .forEach(({ flag, key }) => {
        options.push({
          label: `OBRA | Alterar tradução - ${t(`keyword_language.${key.replace("_artwork", "")}`, "pt-BR")}`,
          emoji: Config.flagLocales[flag as LocalizationsKeys],
          description: ((character?.artworkLocalizations as any)?.[flag] as string || "")?.limit("EmbedDescription"),
          value: `${flag}|${key}`
        });
      });

    [
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
      },
    ]
      .forEach(({ flag, key }) => {
        options.push({
          label: `PERSONAGEM | Alterar tradução - ${t(`keyword_language.${key.replace("_name", "")}`, "pt-BR")}`,
          emoji: Config.flagLocales[flag as LocalizationsKeys],
          description: ((character?.nameLocalizations as any)?.[flag] as string || "")?.limit("EmbedDescription"),
          value: `${flag}|${key}`
        });
      });

    return options;

  }

}