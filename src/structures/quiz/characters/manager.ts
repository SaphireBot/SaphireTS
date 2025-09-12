import {
  AttachmentBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Collection,
  LocaleString,
  Message,
  MessageFlags,
  ModalSubmitInteraction,
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
import { GamingCount, WatchChangeCharacters } from "../../../@types/database";

export default class QuizCharactersManager {

  staffGeneral = [
    StaffsIDs.Rody,
    StaffsIDs.San,
    StaffsIDs.Andre,
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
  control = {
    loading: false,
    isWatching: false,
  };
  static ranking = new Collection<string, GamingCount["Characters"]>();

  constructor() { }

  get allStaff() {
    return Array.from(
      new Set(
        Object.values(this.staff)
          .flat(),
      ),
    );
  }

  getSelectMenuCategoryOptions(locale: LocaleString) {
    const components = this.categories.map(category => {
      const size = this.characters.filter(ch => ch.category === category).size;
      return {
        label: t(`quiz.characters.names.${category}`, locale),
        emoji: e.QuestionMark, // size ? e.QuizCharacters[category as keyof typeof e.QuizCharacters] || e.QuestionMark : e.DenyX,
        description: t("quiz.characters.components.description", { locale, size }),
        value: `${size > 0 ? "" : "zero"}${category}`,
      };
    });

    return components.concat(
      this.genders.map(gender => {
        const size = this.characters.filter(ch => ch.gender === gender).size;
        return {
          label: t(`quiz.characters.names.${gender}`, locale),
          emoji: e.QuestionMark, // size ? e[gender as keyof typeof e] || e.QuestionMark : e.DenyX,
          description: t("quiz.characters.components.description", { locale, size }),
          value: `${size > 0 ? "" : "zero"}${gender}`,
        };
      }) as any,
    );
  }

  async load() {

    if (this.control.loading) return;

    this.control.loading = true;
    this.watcher();
    await this.loadRanking();

    await Database.Characters.find()
      .then(characters => characters.map(character => this.setCharacter(character.toObject())));

    this.control.loading = false;
    return;
  }

  async getAllBlockedUsers() {
    return (await Database.QuizCache.get("QuizCharacters.BlockedUsers") || {}) as Record<string, number>;
  }

  async loadBlockedUsers() {

    const blockUsers = await this.getAllBlockedUsers();
    const date = Date.now();

    for await (const [userId, time] of Object.entries(blockUsers)) {
      if (date >= time) {
        await this.removeBlockedUser(userId);
        continue;
      }

      if (this.blockedTimeouts.has(userId))
        clearTimeout(this.blockedTimeouts.get(userId));

      this.blockedTimeouts.set(
        userId,
        setTimeout(() => this.blockedTimeouts.delete(userId), time - date),
      );

      continue;
    }
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
              .filter(str => typeof str === "string") as string[],
          );

        return str;
      })
      .flat()
      .map(str => str.toLowerCase());

    delete character.__v;

    if (!this.characters.has(character.id))
      if (typeof character.authorId === "string")
        this.usersThatSendCharacters.set(
          character.authorId,
          (this.usersThatSendCharacters.get(character.authorId) || 0) + 1,
        );

    this.artworks.add(character.artwork);
    this.characters.set(character.id, character);

    for (const game of this.games.values())
      game.setCharacter(character);

    return character;
  }

  removeCharacter(character: Character) {

    if (character.authorId && typeof character.authorId === "string") {
      let count = this.usersThatSendCharacters.get(character.authorId) || 0;
      if (typeof count === "number") {
        if (count > 0) count--;
        if (count <= 0) count = 0;
      } count = 0;

      this.usersThatSendCharacters.set(character.authorId, count);
    }

    this.characters.delete(character.id);

    for (const game of this.games.values()) {
      const deleted = game.characters.delete(character.id);
      if (deleted) game.totalRounds--;
    }
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

    const isBlocked = (await Database.QuizCache.get(`QuizCharacters.BlockedUsers.${userId}`) as number) > Date.now();

    if (!isBlocked && this.blockedTimeouts.has(userId))
      await this.removeBlockedUser(userId);

    return isBlocked;
  }

  async getBlockedUser(userId: string) {
    if (!userId) return 0;
    return (await Database.QuizCache.get(`QuizCharacters.BlockedUsers.${userId}`)) as number || 0;
  }

  async setBlockedUser(userId: string, time: number) {
    if (!userId) return 0;

    time += Date.now();

    if (this.blockedTimeouts.has(userId))
      await this.removeBlockedUser(userId);

    await Database.QuizCache.set(`QuizCharacters.BlockedUsers.${userId}`, time);

    this.blockedTimeouts.set(
      userId,
      setTimeout(() => this.blockedTimeouts.delete(userId), time - Date.now()),
    );

    return time;
  }

  async removeBlockedUser(userId: string) {
    if (!userId) return 0;

    if (this.blockedTimeouts.has(userId)) {
      clearTimeout(this.blockedTimeouts.get(userId));
      this.blockedTimeouts.delete(userId);
    }

    return await Database.QuizCache.delete(`QuizCharacters.BlockedUsers.${userId}`);
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

  exists({ name, gender, artwork, category }: Character) {

    return this.characters.some(has)
      || this.allCharactersToBeAdded.some(has);

    function has(character: Character) {
      return (
        character.name.toLowerCase() === name.toLowerCase()
        && character.artwork.toLowerCase() === artwork?.toLowerCase()
        && character.gender === gender
        && character.category === category
      );
    }
  }

  async addView(characterId: string) {

    const character = this.characters.get(characterId);

    if (character) {
      character.views = (character.views || 0) + 1;
      this.characters.set(characterId, character);
    }

    await Database.Characters.updateOne(
      { id: characterId },
      { $inc: { views: 1 } },
    )
      .catch(() => { });
    return;
  }

  async saveOrDeleteNewCharacter(interaction: ButtonInteraction<"cached">, data: { c: "quiz", src: "ind", type: "ok" | "no" }) {

    const { user, userLocale: locale, message } = interaction;

    if (!this.isStaff(user.id))
      return await interaction.reply({
        content: t("quiz.characters.staff_only", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });

    if (message.partial) await message.fetch()?.catch(() => null);

    if (!data?.type) {
      await interaction.update({
        content: `${e.DenyX} | CustomID do botão estão indefinidos.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: [],
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
        files: [],
      }).catch(() => { });
      return setTimeout(async () => await message.delete().catch(() => { }), 5000);
    }

    const character = await Database.CharactersCache.findOne({ pathname: `${id}.png` });

    if (!character) {
      await interaction.update({
        content: `${e.DenyX} | Personagem não encontrado no banco de dados.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: [],
      }).catch(() => { });
      return await this.cancelRequest(message, id);
    }

    if (character?.category === "anime")
      if (!this.staff.anime.includes(user.id))
        return await interaction.reply({
          content: `${e.DenyX} | Você não faz parte da Divisão de Animes.`,
          flags: [MessageFlags.Ephemeral],
        });

    if (character?.category === "animation")
      if (!this.staff.animation.includes(user.id))
        return await interaction.reply({
          content: `${e.DenyX} | Você não faz parte da Divisão de Animação.`,
          flags: [MessageFlags.Ephemeral],
        });

    if (["movie", "game", "serie", "hq", "k-drama"].includes(character?.category))
      if (![StaffsIDs.Rody, StaffsIDs.San].includes(user.id))
        return await interaction.reply({
          content: `${e.DenyX} | Você não faz parte da Divisão de Aprovação Global.`,
          flags: [MessageFlags.Ephemeral],
        });

    if (data?.type === "no") {
      this.notifyUserStatus(
        "quiz.characters.notify_denied",
        character,
      );
      await message.delete()?.catch(() => { });
      return await this.removeDataFromDatabase(character);
    }

    if (this.exists(character)) {
      await interaction.update({
        content: `${e.DenyX} | Esse personagem já está registrado no banco de dados.`,
        embeds: [],
        components: [],
        files: [],
      }).catch(() => { });
      return await this.cancelRequest(message, id);
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
              disabled: true,
            },
          ],
        },
      ].asMessageComponents(),
    })
      .catch(() => { });

    const path = `./temp/characters/${id}.png`;
    const saveImage = await this.saveImage(imageUrl, path);

    if (saveImage !== true) {
      await interaction.editReply({
        content: `${e.DenyX} | Falha ao salvar imagem no cache.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: [],
      }).catch(() => { });
      return await this.cancelRequest(message, id);
    }

    const exists = existsSync(path);
    if (!exists) {
      await interaction.editReply({
        content: `${e.DenyX} | Não foi possível encontrar a imagem salvada.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: [],
      }).catch(() => { });
      return await this.cancelRequest(message, id);
    }

    const cache = QuizCharactersManager.addDataToTempJSON(character.toJSON());
    if (cache !== true) {
      await interaction.editReply({
        content: `${e.DenyX} | Falha ao salvar documento no cache.\n${e.Loading} | Cancelando solicitação...`,
        embeds: [],
        components: [],
        files: [],
      }).catch(() => { });
      return await this.cancelRequest(message, id);
    }

    this.notifyUserStatus(
      "quiz.characters.notify_approved",
      character,
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
              disabled: true,
            },
          ],
        },
      ].asMessageComponents(),
    }).catch(() => { });
    return await this.cancelRequest(message, id);
  }

  async notifyUserStatus(
    contentKey: "quiz.characters.notify_approved" | "quiz.characters.notify_denied",
    character: Character,
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
        artwork: character.artwork,
      })}`.limit("MessageContent"),
    )
      .catch(() => { });
  }

  async cancelRequest(message: Message<true>, id: string) {
    await this.removeDataFromDatabase(null, id);
    return setTimeout(async () => await message.delete().catch(() => { }), 3000);
  }

  async redirectFunctionByCustomID(interaction: ButtonInteraction<"cached"> | ModalSubmitInteraction<"cached">, data: { c: "quiz", src: "ind" }) {

    if (interaction instanceof ModalSubmitInteraction)
      return await modals(interaction, data as any);

    if (data?.src === "ind")
      return this.saveOrDeleteNewCharacter(interaction, data as any);

    return await interaction.reply({
      content: t("quiz.characters.no_custom_data", { e, locale: interaction.userLocale }),
      flags: [MessageFlags.Ephemeral],
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
        authorId: character.authorId,
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
        { encoding: "utf-8" },
      );

      return true;
    } catch (err) {
      return err as Error;
    }

  }

  async removeDataFromDatabase(ch?: Character | null, id?: string) {

    if (!ch && !id) return;

    const character = ch || id && this.characters.find(ch => ch.pathname?.includes(id));
    if (!character) return;

    let count = this.usersThatSendCharacters.get(character.authorId) || 0;
    if (typeof count === "number") {
      if (count > 0) count--;
      if (count <= 0) count = 0;
    } count = 0;

    this.usersThatSendCharacters.set(character.authorId, count);
    return await Database.CharactersCache.deleteOne({ pathname: character.pathname });
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

    if (![Config.ownerId, StaffsIDs.San].includes(user.id))
      return await interaction.reply({
        content: t("quiz.characters.you_cannot_use_this_command", { e, locale }),
      });

    const charactersApproved = JSON.parse(readFileSync("./temp/characters/data.json", { encoding: "utf-8" }) || "[]") as Character[];

    if (!charactersApproved?.length)
      return await interaction.reply({
        content: `${e.DenyX} | A lista de personagens aprovados está vázia.`,
      });

    const content = `${e.Loading} | Transferindo ${charactersApproved.length} personagens para o banco de dados oficial...`;
    let msg: Message<boolean> | undefined | null;

    if (interaction instanceof ChatInputCommandInteraction)
      msg = await interaction.reply({ content, withResponse: true }).then(res => res.resource?.message);

    if (interaction instanceof Message)
      msg = await interaction.reply({ content });

    await sleep(2500);

    return await Database.Characters.create(charactersApproved)
      .then(async data => {

        const images = readdirSync("./temp/characters/").filter(str => !str.endsWith(".json"));
        for (const image of images)
          rmSync(`./temp/characters/${image}`);

        for (const character of data)
          this.setCharacter(character);

        const payload = {
          content: `${e.CheckV} | ${charactersApproved.length} personagens foram transferidos para o banco de dados oficial e configurados no Quiz principal.`,
        };

        try {
          writeFileSync(
            "./temp/characters/data.json",
            JSON.stringify([], null, 4),
            { encoding: "utf-8" },
          );
          if (interaction instanceof ChatInputCommandInteraction)
            return await interaction.editReply(payload).catch(() => { });
          return await msg?.edit(payload).catch(() => { });
        } catch (err) {
          const payload = {
            content: `${e.DenyX} | Houve um erro na transferência de personagens para o banco de dados principal.\n${e.bug} | \`${err}\``,
          };
          if (interaction instanceof ChatInputCommandInteraction)
            return await interaction.editReply(payload).catch(() => { });
          return await msg?.edit(payload).catch(() => { });
        }

      })
      .catch(async err => {

        const payload = {
          content: `${e.DenyX} | Houve um erro na transferência de personagens para o banco de dados principal.\n${e.bug} | \`${err}\``,
        };

        if (interaction instanceof ChatInputCommandInteraction)
          return await interaction.editReply(payload);
        return await msg?.edit(payload);
      });
  }

  async backup(interaction: ChatInputCommandInteraction) {
    const { userLocale: locale, guild, user } = interaction;

    if (!guild)
      return await interaction.reply({
        content: `${e.DenyX} | Este comando só é disponível para uso dentro de um servidor.`,
      });

    if (!this.isStaff(user.id))
      return await interaction.reply({
        content: t("quiz.characters.you_cannot_use_this_command", { e, locale }),
      });

    const list = readdirSync("./temp/characters/").filter(str => !str.endsWith(".json"));

    if (!list.length)
      return await interaction.reply({
        content: t("quiz.characters.no_files_found", { e, locale }),
      });

    await interaction.reply({
      content: t("quiz.characters.zipping", {
        e,
        locale,
        images: list.length,
      }),
      flags: [MessageFlags.Ephemeral],
    });

    const multList: string[][] = [];

    for (let i = 0; i <= list.length; i += 15)
      multList.push(list.slice(i, i + 15));

    for await (const list of multList) {
      await followUp(list);
      await sleep(1500);
    }

    async function followUp(list: string[]) {
      const zip = new Zip();
      for await (const name of list)
        zip.file(
          name,
          readFileSync(`./temp/characters/${name}`),
          { base64: true },
        );

      const buffer = await zip.generateAsync({ type: "nodebuffer" });

      return await interaction.followUp({
        flags: [MessageFlags.Ephemeral],
        files: [
          new AttachmentBuilder(
            buffer,
            {
              name: "characters.zip",
              description: "Characters's Quiz Images",
            },
          ),
        ],
      }).catch(() => { });
    }

    return await interaction.editReply({
      content: `${e.CheckV} | ${list.length} personagens carregados.`,
    }).catch(() => { });
  }

  removeImageFromTempFolder(pathname: string): boolean {
    try {
      if (!existsSync(pathname)) return false;
      rmSync(pathname);
      return true;
    } catch (_) {
      return false;
    }
  }

  buildTranslateSelectMenu(character: Character) {

    const options = [] as any[];

    [
      {
        flag: "pt-BR",
        key: "portuguese_artwork",
      },
      {
        flag: "de",
        key: "german_artwork",
      },
      {
        flag: "en-US",
        key: "english_artwork",
      },
      {
        flag: "es-ES",
        key: "spanish_artwork",
      },
      {
        flag: "fr",
        key: "french_artwork",
      },
      {
        flag: "ja",
        key: "japanese_artwork",
      },
      {
        flag: "zh-CN",
        key: "chinese_artwork",
      },
    ]
      .forEach(({ flag, key }) => {
        options.push({
          label: `OBRA | Alterar tradução - ${t(`keyword_language.${key.replace("_artwork", "")}`, "pt-BR")}`,
          emoji: Config.flagLocales[flag as LocalizationsKeys],
          description: ((character?.artworkLocalizations as any)?.[flag] as string || "")?.limit("EmbedDescription"),
          value: `${flag}|${key}`,
        });
      });

    [
      {
        flag: "pt-BR",
        key: "portuguese_name",
      },
      {
        flag: "de",
        key: "german_name",
      },
      {
        flag: "en-US",
        key: "english_name",
      },
      {
        flag: "es-ES",
        key: "spanish_name",
      },
      {
        flag: "fr",
        key: "french_name",
      },
      {
        flag: "ja",
        key: "japanese_name",
      },
      {
        flag: "zh-CN",
        key: "chinese_name",
      },
    ]
      .forEach(({ flag, key }) => {
        options.push({
          label: `PERSONAGEM | Alterar tradução - ${t(`keyword_language.${key.replace("_name", "")}`, "pt-BR")}`,
          emoji: Config.flagLocales[flag as LocalizationsKeys],
          description: ((character?.nameLocalizations as any)?.[flag] as string || "")?.limit("EmbedDescription"),
          value: `${flag}|${key}`,
        });
      });

    return options;

  }

  watcher() {
    if (this.control.isWatching) return;
    this.control.isWatching = true;
    Database.Characters.watch()
      .on("change", async (change: WatchChangeCharacters) => {

        if (["insert", "update"].includes(change.operationType)) {
          const character = change.fullDocument || await Database.Characters.findById(change.documentKey._id).then(ch => ch?.toObject());

          if (character) {

            const updatedFields = Object.keys(change.updateDescription?.updatedFields || {});
            if (updatedFields.length === 1 && updatedFields[0] === "views") return;

            return this.setCharacter(character);
          }
          return;
        }

        if (change.operationType === "delete") {
          const character = this.characters.find(ch => ch._id?.toString() === change.documentKey._id?.toString());
          if (character?.id) this.removeCharacter(character);
        }
      });
  }

  static refreshRank() {
    this.ranking = this.ranking.sort((a, b) => b.total - a.total);
  }

  async loadRanking() {

    const users = await Database.Users.find(
      { "GamingCount.Characters": { $exists: true } },
      {},
      {
        sort: {
          "GamingCount.Characters.total": -1,
        },
      },
    );

    for (const user of users) {
      const data = (user.GamingCount?.Characters || {}) as GamingCount["Characters"];
      QuizCharactersManager.ranking.set(
        user.id,
        {
          "k-drama": data["k-drama"] || 0,
          animation: data.animation || 0,
          anime: data.anime || 0,
          game: data.game || 0,
          hq: data.hq || 0,
          movie: data.movie || 0,
          serie: data.serie || 0,
          total: data.total || 0,
        },
      );
    }

  }

}