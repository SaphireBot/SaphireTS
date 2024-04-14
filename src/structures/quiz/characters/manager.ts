import {
  AttachmentBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Collection,
  LocaleString,
  Message,
  ModalSubmitInteraction
} from "discord.js";
import { Character, LocalizationsKeys } from "../../../@types/quiz";
import { Config, StaffsIDs, urls } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { existsSync, writeFileSync, readFileSync, rmSync, readdirSync } from "fs";
import Database from "../../../database";
import { CharacterSchemaType } from "../../../database/schemas/character";
import modals from "./modal/modals";
import client from "../../../saphire";
import Zip from "jszip";
import { randomBytes } from "crypto";
import QuizCharacter from "./characters";
import { WatchChangeCharacters } from "../../../@types/database";

export default class QuizCharacters {

  staffGeneral = [
    StaffsIDs.Rody,
    StaffsIDs.San,
    StaffsIDs.Andre
  ];
  games = new Collection<string, QuizCharacter>();
  characters = new Collection<string, Character>();
  categories = ["anime", "movie", "game", "serie", "animation", "hq", "k-drama"];
  genders = ["male", "female", "others"];
  staff = {
    general: this.staffGeneral,
    anime: this.staffGeneral.concat([StaffsIDs.Lewd]),
    animation: this.staffGeneral.concat([StaffsIDs.Moana]),
  };
  blockedTimeouts = new Map<string, NodeJS.Timeout>();
  baseUrl = "https://cdn.saphire.one/characters/";
  artworks = new Set<string>();
  usersThatSendCharacters = new Collection<string, number>();
  loading = true;

  constructor() { }

  get allStaff() {
    return Array.from(
      new Set(
        Object.values(this.staff)
        .flat()
      )
    );
  }

  getSelectMenuCategoryOptions(locale: LocaleString) {
    const components = this.categories.map(category => {
      const size = this.characters.filter(ch => ch.category === category).size;
      return {
        label: t(`quiz.characters.names.${category}`, locale),
        emoji: size ? e.QuizCharacters[category as keyof typeof e.QuizCharacters] : e.DenyX,
        description: t("quiz.characters.components.description", { locale, size }),
        value: `${size > 0 ? "" : "zero"}${category}`
      };
    });

    return components.concat(
      this.genders.map(gender => {
        const size = this.characters.filter(ch => ch.gender === gender).size;
        return {
          label: t(`quiz.characters.names.${gender}`, locale),
          emoji: size ? e[gender as keyof typeof e] || "❔" : e.DenyX,
          description: t("quiz.characters.components.description", { locale, size }),
          value: `${size > 0 ? "" : "zero"}${gender}`
        };
      }) as any
    );
  }

  async load() {

    this.loading = true;
    this.enableWatcher();

    await Database.Characters.find()
      .then(characters => characters.map(character => this.setCharacter(character.toObject())));

    const blockUsers = (await Database.Cache.get("QuizCharacters.BlockedUsers") || []) as Record<string, number>;
    const date = Date.now();

    for await (const [userId, time] of Object.entries(blockUsers)) {
      if (date > time) {
        await this.removeBlockedUser(userId);
        continue;
      }

      if (this.blockedTimeouts.has(userId))
        clearTimeout(this.blockedTimeouts.get(userId));

      this.blockedTimeouts.set(
        userId,
        setTimeout(() => this.blockedTimeouts.delete(userId), time - date)
      );

      continue;
    }

    this.loading = false;
    return;
  }

  isStaff(userId: string) {
    return Object.values(this.staff).flat().includes(userId);
  }

  setCharacter(character: Character | CharacterSchemaType) {

    character.autocompleteSearch = Object.entries(character)
      .map(([k, val]) => {

        const str = [] as string[];

        if (k === "another_answers")
          str.push(...(val as string[]));

        if (typeof val === "string") str.push(val);

        if (typeof val === "object")
          str.push(
            ...Object.values(val)
              .flat()
              .filter(str => typeof str === "string") as string[]
          );

        return str;
      })
      .flat()
      .map(str => str.toLowerCase());

    delete character.__v;

    if (typeof character.authorId === "string")
      this.usersThatSendCharacters.set(
        character.authorId,
        (this.usersThatSendCharacters.get(character.authorId) || 0) + 1
      );
    this.artworks.add(character.artwork);
    this.characters.set(character.id, character);
    return character;
  }

  url(characterOrPathname: Character | string) {
    if (typeof characterOrPathname === "string")
      return this.baseUrl + characterOrPathname;

    if ("pathname" in characterOrPathname) {

      if (existsSync(`./temp/characters/${characterOrPathname.pathname}`))
        return `attachment://${characterOrPathname.pathname}`;

      return this.baseUrl + characterOrPathname.pathname;
    }

    return urls.not_found_image;
  }

  async isBlockedUser(userId: string) {
    if (!userId) return false;

    const isBlocked = (await Database.Cache.get(`QuizCharacters.BlockedUsers.${userId}`) as number) > Date.now();

    if (!isBlocked && this.blockedTimeouts.has(userId))
      await this.removeBlockedUser(userId);

    return isBlocked;
  }

  async getBlockedUser(userId: string) {
    if (!userId) return 0;
    return (await Database.Cache.get(`QuizCharacters.BlockedUsers.${userId}`)) as number || 0;
  }

  async setBlockedUser(userId: string, time: number) {
    if (!userId) return 0;

    time += Date.now();

    if (this.blockedTimeouts.has(userId)) {
      clearTimeout(this.blockedTimeouts.get(userId));
      this.blockedTimeouts.delete(userId);
    }

    await Database.Cache.set(`QuizCharacters.BlockedUsers.${userId}`, time);

    this.blockedTimeouts.set(
      userId,
      setTimeout(() => this.blockedTimeouts.delete(userId))
    );

    return time;
  }

  async removeBlockedUser(userId: string) {
    if (!userId) return 0;

    if (this.blockedTimeouts.has(userId))
      clearTimeout(this.blockedTimeouts.get(userId));

    this.blockedTimeouts.delete(userId);
    return await Database.Cache.delete(`QuizCharacters.BlockedUsers.${userId}`);
  }

  get allCharactersToBeAdded() {
    return JSON.parse(readFileSync("./temp/characters/data.json", { encoding: "utf-8" }) || "[]") as Character[];
  }

  async getCharacterById(id: string) {
    return this.characters.get(id) || await Database.Characters.findOne({ id })?.then(res => res?.toObject());
  }

  async getCharacterByPathname(pathname: string) {
    const character = this.characters.find(ch => ch.pathname === pathname);
    if (character) return character;

    const data = await Database.Characters.findOne({ pathname })?.then(res => res?.toObject());
    if (data) {
      this.setCharacter(data);
      return data;
    }

    return;
  }

  async getCharacterFromCache(pathname: string) {
    return await Database.CharactersCache.findOne({ pathname })?.then(res => res?.toObject());
  }

  async search(queries: string[]) {

    if (!this.characters.size)
      await this.load();

    const query = new Set(queries.map(str => str.toLowerCase()));

    const characters = this.characters.filter(character => {
      return character.autocompleteSearch?.some(str => query.has(str) || queries.some(s => str.includes(s)));
    });

    const cached = this.allCharactersToBeAdded.filter(character => {
      return query.has(character.id!)
        || query.has(character.name.toLowerCase())
        || query.has(character.artwork.toLowerCase())
        || query.has(character.pathname);
    });

    if (cached.length)
      for (const cache of cached.values())
        characters.set(cache.id, cache);

    return characters;
  }

  exists(queries: string[]) {
    const query = new Set(queries.filter(Boolean).map(str => str.toLowerCase()));

    return this.characters.some(has)
      || this.allCharactersToBeAdded.some(has);

    function has(character: Character) {
      return query.has(character.id!)
        || (
          query.has(character.name.toLowerCase())
          && query.has(character.artwork.toLowerCase())
          && query.has(character.gender)
        )
        || query.has(character.pathname);
    }
  }

  async saveOrDeleteNewCharacter(interaction: ButtonInteraction<"cached">, data: { c: "quiz", src: "ind", type: "ok" | "no" }) {

    const { user, userLocale: locale, message } = interaction;

    if (!this.isStaff(user.id))
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

    if (character?.category === "anime")
      if (!this.staff.anime.includes(user.id))
        return await interaction.reply({
          content: `${e.DenyX} | Você não faz parte da Divisão de Animes.`,
          ephemeral: true
        });

    if (character?.category === "animation")
      if (!this.staff.animation.includes(user.id))
        return await interaction.reply({
          content: `${e.DenyX} | Você não faz parte da Divisão de Animação.`,
          ephemeral: true
        });

    if (["movie" || "game" || "serie" || "hq" || "k-drama"].includes(character?.category))
      if (![StaffsIDs.Rody, StaffsIDs.San].includes(user.id))
        return await interaction.reply({
          content: `${e.DenyX} | Você não faz parte da Divisão de Aprovação Global.`,
          ephemeral: true
        });

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
    })
      .catch(() => { });

    const path = `./temp/characters/${id}.png`;
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
    await client.channels.send(
      character.channelId,
      `${t(contentKey, {
        e,
        locale,
        authorId: character.authorId,
        name: character.name,
        category: t(`quiz.characters.names.${character.category}`, locale),
        artwork: character.artwork
      })}`.limit("MessageContent")
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

      const json = JSON.parse(readFileSync("./temp/characters/data.json", { encoding: "utf-8" }) || "[]") as Character[];

      const CharacterDataJSON: Character = {
        nameLocalizations: {},
        artworkLocalizations: {},
        id: randomBytes(7).toString("base64url"),
        name: character.name,
        artwork: character.artwork,
        another_answers: character.another_answers,
        gender: character.gender,
        category: character.category,
        pathname: character.pathname,
        authorId: character.authorId
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
        "./temp/characters/data.json",
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

    const charactersApproved = JSON.parse(readFileSync("./temp/characters/data.json", { encoding: "utf-8" }) || "[]") as Character[];

    if (!charactersApproved?.length)
      return await interaction.reply({
        content: `${e.DenyX} | A lista de personagens aprovados está vázia.`
      });

    const msg = await interaction.reply({
      content: `${e.Loading} | Transferindo ${charactersApproved.length} personagens para o banco de dados oficial...`,
      fetchReply: interaction instanceof ChatInputCommandInteraction
    });

    await sleep(2500);

    return await Database.Characters.create(charactersApproved)
      .then(async data => {

        const images = readdirSync("./temp/characters/").filter(str => !str.endsWith(".json"));
        for (const image of images)
          rmSync(`./temp/characters/${image}`);

        for (const character of data)
          this.setCharacter(character);

        const payload = {
          content: `${e.CheckV} | ${charactersApproved.length} personagens foram transferidos para o banco de dados oficial e configurados no Quiz principal.`
        };

        try {
          writeFileSync(
            "./temp/characters/data.json",
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

  async backup(interaction: ChatInputCommandInteraction | Message) {
    const { userLocale: locale } = interaction;
    const user = "user" in interaction ? interaction.user : interaction.author;

    if (!this.isStaff(user.id))
      return await interaction.reply({
        content: t("quiz.characters.you_cannot_use_this_command", { e, locale })
      });

    const list = readdirSync("./temp/characters/").filter(str => !str.endsWith(".json"));

    if (!list.length)
      return await interaction.reply({
        content: t("quiz.characters.no_files_found", { e, locale })
      });

    const msg = await interaction.reply({
      content: t("quiz.characters.zipping", {
        e,
        locale,
        images: list.length
      }),
      fetchReply: interaction instanceof Message,
      ephemeral: interaction instanceof ChatInputCommandInteraction,
    });

    const zip = new Zip();
    for await (const name of list)
      zip.file(
        name,
        readFileSync(`./temp/characters/${name}`),
        { base64: true }
      );

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    const payload = {
      content: t("quiz.characters.zipped", {
        e,
        locale,
        images: list.length
      }),
      files: [
        new AttachmentBuilder(
          buffer,
          {
            name: "characters.zip",
            description: "Characters's Quiz Images"
          }
        )
      ]
    };

    return interaction instanceof ChatInputCommandInteraction
      ? await interaction.editReply(payload).catch(() => { })
      : await msg?.edit(payload).catch(() => { });
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

  enableWatcher() {
    Database.Characters.watch()
      .on("change", async (change: WatchChangeCharacters) => {

        if (["insert", "update"].includes(change.operationType)) {
          const character = change.fullDocument || await Database.Characters.findById(change.documentKey._id).then(ch => ch?.toObject());
          if (character) return this.setCharacter(character);
          return;
        }

        if (change.operationType === "delete") {
          const character = this.characters.find(ch => ch._id?.toString() === change.documentKey._id?.toString());
          if (character?.id)
            for (const quiz of this.games.values())
              quiz.characters.delete(character.id);
        }
      });
  }

}