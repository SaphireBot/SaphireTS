import {
  APIEmbed,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  LocaleString,
  Message,
  StringSelectMenuInteraction,
  parseEmoji,
  time,
  User,
  ComponentType,
  MessageFlags,
} from "discord.js";
import { Character } from "../../../@types/quiz";
import { QuizCharactersManager } from "..";
import { ChannelsInGame, KeyOfLanguages, urls } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import client from "../../../saphire";
import { mapButtons } from "djs-protofy";
type Interaction = ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached"> | Message<true> | StringSelectMenuInteraction<"cached">;

export default class QuizCharacter {

  rounds = 0;
  points: Record<string, Record<Character["category"] | "total", number>> = {};
  players = new Map<string, GuildMember>();
  characters = new Collection<string, Character>();
  categories = new Set<string>();
  settings = new Set<string>();

  declare readonly interaction: Interaction;
  declare readonly channel: GuildTextBasedChannel;
  declare readonly channelId: string;
  declare readonly user: User;
  declare readonly guild: Guild | null;
  declare _locale: LocaleString;
  declare message: Message | void;
  declare timeStyle: "normal" | "fast" | undefined;
  declare totalRounds: number;

  constructor(
    interaction: Interaction,
    options: Set<string>,
  ) {

    this.settings = options;

    for (const opt of options)
      if (QuizCharactersManager.categories.includes(opt))
        this.categories.add(opt);

    this.setCharacter();
    this.interaction = interaction;
    this.channel = interaction.channel!;
    this.channelId = interaction.channel!.id!;
    this.user = "user" in interaction ? interaction.user : interaction.author;
    this.guild = interaction.guild;

    this.chooseTypeStyle(this.interaction as ButtonInteraction | ChatInputCommandInteraction);
  }

  setCharacter(ch?: Character) {

    if (ch && (this.settings.has(ch.gender) || this.settings.has(ch.category))) {
      this.totalRounds++;
      return this.characters.set(ch.id, ch);
    }

    this.characters = this.settings.size
      ? QuizCharactersManager.characters
        .filter(ch => this.settings.has(ch.gender) || this.settings.has(ch.category))
      : QuizCharactersManager.characters;

    this.totalRounds = this.characters.size;

    return;
  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (
      this.interaction instanceof Message
      || this.interaction instanceof StringSelectMenuInteraction
    ) {
      const content = "message" in this.interaction ? this.interaction.message.content || "" : this.interaction.content || "";
      for (const arg of content?.split(" ") || [] as string[])
        if (KeyOfLanguages[arg as keyof typeof KeyOfLanguages]) {
          this._locale = KeyOfLanguages[arg as keyof typeof KeyOfLanguages] as LocaleString;
          return this._locale;
        }
    }

    if (this.interaction instanceof ChatInputCommandInteraction) {

      const fromAutocomplete = this.interaction.options.getString("language") as LocaleString;
      if (KeyOfLanguages[fromAutocomplete as keyof typeof KeyOfLanguages]) {
        this._locale = KeyOfLanguages[fromAutocomplete as keyof typeof KeyOfLanguages] as LocaleString;
        return this._locale;
      }

      if (KeyOfLanguages[this.interaction.guild?.preferredLocale as keyof typeof KeyOfLanguages]) {
        this._locale = KeyOfLanguages[this.interaction.guild?.preferredLocale as keyof typeof KeyOfLanguages] as LocaleString;
        return this._locale;
      }

      this._locale = client.defaultLocale as LocaleString;;
      return this._locale;
    }

    this._locale = KeyOfLanguages[
      (
        this.interaction.guild?.preferredLocale
        || this.interaction.userLocale
        || client.defaultLocale
      ) as keyof typeof KeyOfLanguages
    ] as LocaleString;

    if (!KeyOfLanguages[this._locale as keyof typeof KeyOfLanguages])
      this._locale = client.defaultLocale as "pt-BR";

    return this._locale;
  }

  get roundTime() {
    return 1000 * (this.timeStyle === "normal" ? 8 : 4);
  }

  get dateRoundTime() {
    return new Date(
      Date.now() + this.roundTime,
    );
  }

  get embed(): APIEmbed {
    const embed = this.message?.embeds?.[0]?.toJSON()
      || {
      title: t("quiz.characters.title", { e, locale: this.locale, client }),
    };

    embed.color = Colors.Blue;
    return embed;
  }

  get ranking() {
    const entries = Object.entries(this.points);
    let ranking = entries
      .sort((a, b) => b[1]?.total - a[1]?.total)
      .slice(0, 5)
      .map(([userId, points]) => `${`<@${userId}>`} ${points.total} ${t("quiz.flags.points", this.locale)}`)
      .join("\n");

    if (entries.length > 5)
      ranking += `\n${t("quiz.flags.+players", { players: entries.length - 5, locale: this.locale })}`;

    if (!entries.length)
      return "";

    return ranking;
  }

  async chooseTypeStyle(int: ButtonInteraction | ChatInputCommandInteraction) {

    QuizCharactersManager.games.set(this.channelId, this);

    this.timeStyle = this.interaction instanceof ChatInputCommandInteraction
      ? this.interaction.options.getString("style") as "normal" | "fast" || "normal"
      : "normal";

    if (this.interaction instanceof ChatInputCommandInteraction) {
      const mode = this.interaction.options.getString("answers") as "alternatives" | "keyboard" | null;
      if (mode) {

        const data: any = {
          content: t("quiz.charactes.loading_characters", { e, locale: this.locale }),
          fetchReply: true,
          embeds: [],
          components: [],
        };

        if (int instanceof ButtonInteraction)
          this.message = await int.update(data).catch(this.error.bind(this)) as any;

        if (int instanceof ChatInputCommandInteraction)
          this.message = await int.reply(data).catch(this.error.bind(this)) as any;

        if (mode === "alternatives")
          return setTimeout(async () => await this.newAlternativeRound(), 4000);

        if (mode === "keyboard")
          return setTimeout(async () => await this.newKeyboardRound(), 4000);
      }
    }

    const data: any = {
      content: null,
      fetchReply: true,
      embeds: [{
        color: Colors.Blue,
        title: t("quiz.characters.title", { locale: this.interaction.userLocale, client }),
        description: t("quiz.choose_type", { e, locale: this.interaction.userLocale }),
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              emoji: e.Commands,
              label: t("quiz.flags.buttons.alternatives", this.interaction.userLocale),
              custom_id: "alternatives",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: e.typing,
              label: t("quiz.flags.buttons.keyboard", this.interaction.userLocale),
              custom_id: "keyboard",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: e.DenyX,
              label: t("quiz.flags.buttons.cancel", this.interaction.userLocale),
              custom_id: "cancel",
              style: ButtonStyle.Danger,
            },
          ],
        },
      ].asMessageComponents(),
    };

    if (int instanceof ButtonInteraction)
      this.message = await int.update(data).catch(this.error.bind(this)) as any;

    if (int instanceof ChatInputCommandInteraction)
      this.message = await int.reply(data).catch(this.error.bind(this)) as any;

    if (!this.message) return await this.error("Origin message not found");
    const collector = this.message.createMessageComponentCollector({
      time: 1000 * 60,
      filter: int => int.user.id === this.user.id,
    })
      .on("collect", async (int: ButtonInteraction): Promise<any> => {

        const { customId } = int;

        if (customId === "cancel") return await this.cancel(int);
        if (!this.message) return await this.error("Origin message not found");

        await this.message.edit({
          content: t("quiz.characters.loading_characters", { e, locale: this.locale }),
          embeds: [],
          components: [],
        })
          .catch(this.error.bind(this));

        collector.stop();

        if (customId === "alternatives")
          return setTimeout(async () => await this.newAlternativeRound(), 4000);

        if (customId === "keyboard")
          return setTimeout(async () => await this.newKeyboardRound(), 4000);

      })
      .on("end", async (_, reason: string): Promise<any> => {
        if (reason === "user") return;
        return await this.cancel();
      });

    return;
  }

  async error(err: Error | string) {
    await this.finish();
    await this.message?.delete().catch(() => { });
    this.message = undefined;
    await this.channel.send({
      content: t("quiz.characters.error", {
        e,
        locale: this.locale,
        err,
      }),
    }).catch(() => { });
    return;
  }

  async finish() {
    QuizCharactersManager.games.delete(this.channelId);
    ChannelsInGame.delete(this.channel.id);

    const entries = Object.entries(this.points || {});

    if (entries.length) {
      const data: any = entries
        .map(([id, options]) => {

          const $inc: Record<string, number> = {};

          for (const [key, value] of Object.entries(options))
            $inc[`GamingCount.Characters.${key}`] = value;

          return {
            updateOne: {
              filter: { id },
              update: { $inc },
              upsert: true,
            },
          };
        });

      await Database.Users.collection.bulkWrite(data, { ordered: true }).catch(() => { });
    }

    return;
  }

  async cancel(interaction?: ButtonInteraction) {
    QuizCharactersManager.games.delete(this.channelId);
    ChannelsInGame.delete(this.channel.id);

    const payload = {
      content: t("quiz.characters.cancelled", { e, locale: this.locale }),
      embeds: [], components: [],
    };

    if (interaction)
      return await interaction.update(payload).catch(() => this.send.bind(payload));

    if (this.message)
      return await this.message.edit(payload).catch(() => this.send.bind(payload));

    return this.send(payload);
  }

  async send(
    { content, embeds, components }:
      { content?: string | undefined, embeds?: any[], components?: any[] },
  ) {
    return await this.channel.send({
      content,
      embeds,
      components,
    }).catch(() => { });
  }

  async addPoint(userId: string, category: Character["category"] | "total") {

    const data = this.points[userId] || {};

    if (data.total) data.total++;
    else data.total = 1;

    if (data[category]) data[category]++;
    else data[category] = 1;

    this.points[userId] = data;

    return;
  }

  async deleteMessage() {
    if (!this.message) return;
    await this.message.delete().catch(() => { });
  }

  getCharacter() {
    const id = this.characters.randomKey();
    if (id) {
      const ch = this.characters.get(id);
      this.characters.delete(id);
      return ch;
    }
    return;
  }

  async noCharactersAvailable() {
    await this.finish();
    if (!this.message) return await this.error("Origin message not found");

    const embed = this.embed;
    if (!embed.title) embed.title = t("quiz.characters.title", { locale: this.locale, client });
    embed.color = Colors.Red;
    delete embed.image;
    embed.fields = [];

    const ranking = this.ranking;
    if (ranking.length)
      embed.fields[0] = {
        name: t("quiz.flags.ranking_name", this.locale),
        value: ranking,
      };

    embed.description = t("quiz.characters.no_characters", {
      e,
      locale: this.locale,
    });

    await this.deleteMessage();
    await this.channel.send({
      embeds: [embed],
      components: [],
    })
      .catch(() => { });
    return;
  }

  async newAlternativeRound() {
    if (!this.message) return await this.error("Origin message not found");

    this.rounds++;
    await this.deleteMessage();

    const character = this.getCharacter();
    if (!character) return await this.noCharactersAvailable();
    const embed = this.buildMatchEmbed(character.pathname);
    const components = this.generateButtons(character);

    this.message = await this.channel.send({
      embeds: [embed],
      components,
    })
      .then(msg => {
        QuizCharactersManager.addView(character.id);
        return msg;
      })
      .catch(this.error.bind(this));

    if (!this.message) return;
    return await this.enableAlternativeCollector(character);
  }

  buildMatchEmbed(pathname: string): APIEmbed {
    return {
      color: Colors.Blue,
      title: t("quiz.characters.title", { e, locale: this.locale, client }),
      description: t("quiz.characters.characters_description", {
        e,
        locale: this.locale,
        time: time(this.dateRoundTime, "R"),
      }),
      image: {
        url: urls.cdn("characters", pathname),
      },
      footer: {
        text: t("quiz.characters.rounds", {
          locale: this.locale,
          rounds: this.rounds || 1,
          totalRounds: this.totalRounds || 1,
        }),
      },
    };
  }

  generateButtons(character: Character) {

    const keys = new Set<string>();
    keys.add(character.id);
    const getName = this.getCharacterName.bind(this);
    let characters = this.characters.filter(ch => ch.category === character.category);
    if (characters.size <= 3)
      characters = QuizCharactersManager.characters.filter(ch => ch.category === character.category);

    function component() {
      if (keys.size >= 5) return;

      const character = characters.random()!;
      if (!character?.id || characters.size === 1) return;

      if (keys.has(character.id)) {
        if (QuizCharactersManager.characters.size > 5)
          return component();
        return;
      }

      const name = getName(character);
      keys.add(character.id);

      return {
        type: 2,
        label: name.limit("ButtonLabel").limit("ButtonLabel"),
        custom_id: character.id,
        style: ButtonStyle.Primary,
      };
    }

    return [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: this.getCharacterName(character).limit("ButtonLabel"),
            custom_id: character.id,
            style: ButtonStyle.Primary,
          },
          component(),
          component(),
          component(),
          component(),
        ]
          .filter(Boolean)
          .shuffle(),
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            emoji: parseEmoji("🔄"),
            custom_id: "refresh",
            style: ButtonStyle.Primary,
          },
        ],
      },
    ].asMessageComponents();

  }

  async enableAlternativeCollector(character: Character) {
    if (!this.message) return await this.error("Origin message not found");

    const alreadyAnswers = new Set<string>();

    const collector = this.message.createMessageComponentCollector({
      filter: () => true,
      time: this.roundTime,
      componentType: ComponentType.Button,
    })
      .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

        const { user, userLocale: locale, member, customId } = int;

        if (customId === "refresh")
          return await int.update({ embeds: int.message.embeds })
            .catch(this.error.bind(this));

        if (alreadyAnswers.has(user.id))
          return await int.reply({
            content: t("quiz.flags.already_answer", { e, locale }),
            flags: [MessageFlags.Ephemeral],
          });
        else {
          alreadyAnswers.add(user.id);
          this.players.set(user.id, member);
        }

        const ch = QuizCharactersManager.characters.get(customId);
        if (ch && customId !== character.id) {
          return await int.reply({
            content: t("quiz.characters.mistake", { e, locale, name: ch.name }),
            flags: [MessageFlags.Ephemeral],
          });
        }

        if (customId === character.id) {
          collector.stop();
          this.addPoint(user.id, character.category);
          await this.disableButtonsAndStartNewRound(int, character);
          return;
        }

      })
      .on("end", async (_, reason: string): Promise<any> => {
        if (reason === "user") return;
        if (reason === "time") return await this.timeOver(character);

        QuizCharactersManager.games.delete(this.channelId);
        ChannelsInGame.delete(this.channel.id);
        if (["channelDelete", "guildDelete"].includes(reason))
          return await this.finish();
      });

    return;
  }

  getCharacterCategory(character: Character) {
    return t(`quiz.characters.names.${character.category}`, this.locale);
  }

  getCharacterArtwork(character: Character) {
    return character.artworkLocalizations?.[this.locale as keyof typeof character.artworkLocalizations] || character.artwork;
  }

  getCharacterName(character: Character) {
    return character.nameLocalizations?.[this.locale as keyof typeof character.nameLocalizations] || character.name;
  }

  async timeOver(character: Character) {
    await this.finish();
    if (!this.message) return await this.error("Origin message not found");

    const embed = this.embed;

    if (!embed.title) embed.title = t("quiz.characters.title", { locale: this.locale, client });
    embed.color = Colors.Red;

    if (!embed.fields)
      embed.fields = [];

    const ranking = this.ranking;
    if (ranking.length)
      embed.fields[0] = {
        name: t("quiz.flags.ranking_name", this.locale),
        value: ranking,
      };

    embed.description = t("quiz.characters.time_over", {
      e,
      locale: this.locale,
      name: this.getCharacterName(character),
      category: this.getCharacterCategory(character),
      artwork: this.getCharacterArtwork(character),
    });

    const components = mapButtons(
      this.message.components,
      button => {
        button.disabled = true;
        return button;
      },
    );

    await this.deleteMessage();
    return await this.channel.send({
      embeds: [embed],
      components,
    })
      .catch(() => { });
  }

  async disableButtonsAndStartNewRound(int: ButtonInteraction, character: Character): Promise<void> {
    if (!this.message) return await this.error("Origin message not found");

    if (!this.characters.size)
      return await this.noCharactersAvailable();

    const { message, customId } = int;

    const components = mapButtons(
      message.components,
      (button) => {
        if (!("custom_id" in button)) return button;

        button.disabled = true;
        button.style = button.custom_id === customId
          ? ((): ButtonStyle.Success => {
            button.emoji = parseEmoji(e.Animated.SaphireDance)!;
            return ButtonStyle.Success;
          })()
          : ButtonStyle.Secondary;

        return button;
      });

    const embed = this.embed;
    embed.color = Colors.Green;
    embed.description = this.getDescription(character, int.user);

    if (!embed.fields)
      embed.fields = [];

    const ranking = this.ranking;
    if (ranking.length)
      embed.fields[0] = {
        name: t("quiz.flags.ranking_name", this.locale),
        value: ranking,
      };

    this.message = await int.update({
      embeds: [embed],
      components,
      fetchReply: true,
    }).catch(this.error.bind(this));

    setTimeout(async () => await this.newAlternativeRound(), 4000);
    return;
  }

  async newKeyboardRound() {
    if (!this.message) return await this.error("Origin message not found");

    this.rounds++;
    await this.deleteMessage();

    const character = this.getCharacter();
    if (!character) return await this.noCharactersAvailable();
    const embed = this.buildMatchEmbed(character.pathname);
    const answers = new Set<string>();

    for (const name of [Object.values(character.nameLocalizations || {}), character.name, character.another_answers].flat())
      if (name) answers.add(name.toLowerCase().trim());

    this.message = await this.channel.send({ embeds: [embed] })
      .then(msg => {
        QuizCharactersManager.addView(character.id);
        return msg;
      })
      .catch(this.error.bind(this));

    if (!this.message) return;
    return await this.enableKeyboardCollector(character, answers);
  }

  getDescription(character: Character, user: User) {
    return t("quiz.characters.correct_description", {
      e,
      locale: this.locale,
      user,
      name: this.getCharacterName(character),
      category: this.getCharacterCategory(character),
      artwork: this.getCharacterArtwork(character),
      time: time(new Date(Date.now() + 4000), "R"),
    });
  }

  async enableKeyboardCollector(character: Character, answers: Set<string>) {

    return this.channel.createMessageCollector({
      filter: msg => answers.has(msg.content?.toLowerCase()),
      time: this.roundTime,
      max: 1,
    })
      .on("collect", async (message): Promise<any> => {
        if (!this.message) return await this.error("Origin message not found");

        await message.react(e.Animated.SaphireDance).catch(() => { });
        this.addPoint(message.author.id, character.category);

        const embed = this.embed;
        embed.color = Colors.Green;
        embed.description = this.getDescription(character, message.author);

        if (!embed.fields)
          embed.fields = [];

        const ranking = this.ranking;
        if (ranking.length)
          embed.fields[0] = {
            name: t("quiz.flags.ranking_name", this.locale),
            value: ranking,
          };

        await this.message.edit({ embeds: [embed] }).catch(this.error.bind(this));

        setTimeout(async () => await this.newKeyboardRound(), 4000);
        return;
      })
      .on("end", async (_, reason): Promise<any> => {
        if (["user", "limit"].includes(reason)) return;
        if (reason === "time") return await this.timeOver(character);

        QuizCharactersManager.games.delete(this.channelId);
        ChannelsInGame.delete(this.channel.id);
        if (["channelDelete", "guildDelete"].includes(reason))
          return await this.finish();
      });

  }

}