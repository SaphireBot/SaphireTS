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
  time
} from "discord.js";
import { Character } from "../../../@types/quiz";
import { QuizCharactersManager } from "..";
import { User } from "discord.js";
import { ChannelsInGame, urls } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import client from "../../../saphire";
import { ComponentType } from "discord.js";
import { mapButtons } from "djs-protofy";
type Interaction = ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached"> | Message<true> | StringSelectMenuInteraction<"cached">;

export default class QuizCharacter {

  rounds = 0;
  points: Record<string, number> = {};
  players = new Map<string, GuildMember>();
  characters = new Collection<string, Character>();

  declare readonly interaction: Interaction;
  declare readonly channel: GuildTextBasedChannel;
  declare readonly channelId: string;
  declare readonly user: User;
  declare readonly guild: Guild | null;
  declare _locale: LocaleString;
  declare totalRounds: number;
  declare message: Message | void;
  declare timeStyle: "normal" | "fast" | undefined;

  constructor(
    interaction: Interaction,
    options: Set<string>
  ) {

    this.characters = options.size
      ? QuizCharactersManager.characters
        .filter(ch => options.has(ch.gender) || options.has(ch.category))
      : QuizCharactersManager.characters;

    this.totalRounds = this.characters.size;
    this.interaction = interaction;
    this.channel = interaction.channel!;
    this.channelId = interaction.channel!.id!;
    this.user = "user" in interaction ? interaction.user : interaction.author;
    this.guild = interaction.guild;

    this.chooseTypeStyle(this.interaction as ButtonInteraction | ChatInputCommandInteraction);
  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (this.interaction instanceof ChatInputCommandInteraction) {
      this._locale = this.interaction.options.getString("language") as LocaleString
        || this.interaction.guild?.preferredLocale
        || "pt-BR";
      return this._locale;
    }

    this._locale = this.interaction.guild?.preferredLocale
      || this.interaction.userLocale
      || "pt-BR";

    return this._locale;
  }

  get roundTime() {
    return 1000 * (this.timeStyle === "normal" ? 8 : 4);
  }

  get dateRoundTime() {
    return new Date(
      Date.now() + this.roundTime
    );
  }

  get embed(): APIEmbed {
    return this.message?.embeds?.[0]?.toJSON()
      || {
      title: t("quiz.characters.title", { e, locale: this.locale, client }),
      color: Colors.Blue
    };
  }

  get ranking() {
    const entries = Object.entries(this.points);
    let ranking = entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, points]) => `${`<@${userId}>`} ${points} ${t("quiz.flags.points", this.locale)}`)
      .join("\n");

    if (entries.length > 5)
      ranking += `\n${t("quiz.flags.+players", { players: entries.length - 5, locale: this.locale })}`;

    if (!entries.length)
      return "";

    return ranking;
  }

  async chooseTypeStyle(int: ButtonInteraction | ChatInputCommandInteraction) {

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
          components: []
        };

        if (int instanceof ButtonInteraction)
          this.message = await int.update(data).catch(this.error.bind(this));

        if (int instanceof ChatInputCommandInteraction)
          this.message = await int.reply(data).catch(this.error.bind(this));

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
        description: t("quiz.choose_type", { e, locale: this.interaction.userLocale })
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
              style: ButtonStyle.Primary
            },
            {
              type: 2,
              emoji: e.typing,
              label: t("quiz.flags.buttons.keyboard", this.interaction.userLocale),
              custom_id: "keyboard",
              style: ButtonStyle.Primary
            },
            {
              type: 2,
              emoji: e.DenyX,
              label: t("quiz.flags.buttons.cancel", this.interaction.userLocale),
              custom_id: "cancel",
              style: ButtonStyle.Danger
            }
          ]
        }
      ].asMessageComponents()
    };

    if (int instanceof ButtonInteraction)
      this.message = await int.update(data).catch(this.error.bind(this));

    if (int instanceof ChatInputCommandInteraction)
      this.message = await int.reply(data).catch(this.error.bind(this));

    if (!this.message) return await this.error("Origin message not found");
    const collector = this.message.createMessageComponentCollector({
      time: 1000 * 60,
      filter: int => int.user.id === this.user.id
    })
      .on("collect", async (int: ButtonInteraction): Promise<any> => {

        const { customId } = int;

        if (customId === "cancel") return await this.cancel(int);
        if (!this.message) return await this.error("Origin message not found");

        await this.message.edit({
          content: t("quiz.characters.loading_characters", { e, locale: this.locale }),
          embeds: [],
          components: []
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
        err
      })
    }).catch(() => { });
    return;
  }

  async finish() {
    ChannelsInGame.delete(this.channel.id);

    const entries = Object.entries(this.points || {});

    if (entries.length) {
      const data = entries
        .map(([id, points]) => ({
          updateOne: {
            filter: { id },
            update: {
              $inc: {
                ["GamingCount.QuizCharacters"]: points
              }
            },
            upsert: true
          }
        }));

      await Database.Users.collection.bulkWrite(data, { ordered: true }).catch(() => { });
    }

  }

  async cancel(interaction?: ButtonInteraction) {
    ChannelsInGame.delete(this.channel.id);

    const payload = {
      content: t("quiz.characters.cancelled", { e, locale: this.locale }),
      embeds: [], components: []
    };

    if (interaction)
      return await interaction.update(payload).catch(() => this.send.bind(payload));

    if (this.message)
      return await this.message.edit(payload).catch(() => this.send.bind(payload));

    return this.send(payload);
  }

  async send(
    { content, embeds, components }:
      { content?: string | undefined, embeds?: any[], components?: any[] }
  ) {
    return await this.channel.send({
      content,
      embeds,
      components
    }).catch(() => { });
  }

  addPoint(userId: string) {
    return this.points[userId] ? this.points[userId]++ : this.points[userId] = 1;
  }

  async deleteMessage() {
    if (!this.message) return;
    await this.message.delete().catch(() => { });
  }

  getCharacter() {
    const character = this.characters.random();
    if (character) this.characters.delete(character.id);
    return character;
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
        value: ranking
      };

    embed.description = t("quiz.characters.no_characters", {
      e,
      locale: this.locale
    });

    await this.deleteMessage();
    await this.channel.send({
      embeds: [embed],
      components: []
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
    const buttons = this.generateButtons(character);

    this.message = await this.channel.send({
      embeds: [embed],
      components: buttons.asMessageComponents()
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
        time: time(this.dateRoundTime, "R")
      }),
      image: {
        url: urls.cdn("characters", pathname)
      },
      footer: {
        text: t("quiz.characters.rounds", {
          locale: this.locale,
          rounds: this.rounds,
          totalRounds: this.totalRounds
        })
      }
    };
  }

  generateButtons(character: Character) {

    const keys = new Set<string>();
    keys.add(character.id);
    const getName = this.getCharacterName.bind(this);

    function component() {
      const character = QuizCharactersManager.characters.random();
      if (!character?.id) return;

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
        style: ButtonStyle.Primary
      };
    }

    return [{
      type: 1,
      components: [
        {
          type: 2,
          label: this.getCharacterName(character).limit("ButtonLabel"),
          custom_id: character.id,
          style: ButtonStyle.Primary
        },
        component(),
        component(),
        component(),
        component()
      ]
        .filter(Boolean)
        .shuffle()
    }];

  }

  async enableAlternativeCollector(character: Character) {
    if (!this.message) return await this.error("Origin message not found");

    const alreadyAnswers = new Set<string>();

    const collector = this.message.createMessageComponentCollector({
      filter: () => true,
      time: this.roundTime,
      componentType: ComponentType.Button
    })
      .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

        const { user, userLocale: locale, member, customId } = int;

        if (alreadyAnswers.has(user.id))
          return await int.reply({
            content: t("quiz.flags.already_answer", { e, locale }),
            ephemeral: true
          });
        else {
          alreadyAnswers.add(user.id);
          this.players.set(user.id, member);
        }

        const ch = QuizCharactersManager.characters.get(customId);
        if (ch && customId !== character.id) {
          return await int.reply({
            content: t("quiz.characters.mistake", { e, locale, name: ch.name }),
            ephemeral: true
          });
        }

        if (customId === character.id) {
          collector.stop();
          this.addPoint(user.id);
          await this.disableButtonsAndStartNewRound(int, character);
          return;
        }

      })
      .on("end", async (_, reason: string): Promise<any> => {
        if (reason === "user") return;
        if (reason === "time") return await this.timeOver(character);

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
        value: ranking
      };

    embed.description = t("quiz.characters.time_over", {
      e,
      locale: this.locale,
      name: this.getCharacterName(character),
      category: this.getCharacterCategory(character),
      artwork: this.getCharacterArtwork(character)
    });

    const components = mapButtons(
      this.message.components,
      button => {
        button.disabled = true;
        return button;
      }
    );

    await this.deleteMessage();
    return await this.channel.send({
      embeds: [embed],
      components
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
        if (button.style === ButtonStyle.Link) return button;

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
    embed.description = t("quiz.characters.correct_description", {
      e,
      locale: this.locale,
      user: int.user,
      name: this.getCharacterName(character),
      category: this.getCharacterCategory(character),
      artwork: this.getCharacterArtwork(character),
      time: time(this.dateRoundTime, "R")
    });

    if (!embed.fields)
      embed.fields = [];

    const ranking = this.ranking;
    if (ranking.length)
      embed.fields[0] = {
        name: t("quiz.flags.ranking_name", this.locale),
        value: ranking
      };

    this.message = await int.update({
      embeds: [embed],
      components,
      fetchReply: true
    }).catch(this.error.bind(this));

    setTimeout(async () => await this.newAlternativeRound(), this.roundTime - 2000);
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
      if (name) answers.add(name.toLowerCase());

    this.message = await this.channel.send({ embeds: [embed] })
      .catch(this.error.bind(this));

    if (!this.message) return;
    return await this.enableKeyboardCollector(character, answers);
  }

  async enableKeyboardCollector(character: Character, answers: Set<string>) {

    return this.channel.createMessageCollector({
      filter: msg => answers.has(msg.content?.toLowerCase()),
      time: this.roundTime,
      max: 1
    })
      .on("collect", async (message): Promise<any> => {
        if (!this.message) return await this.error("Origin message not found");

        const { author } = message;
        await message.react("⭐").catch(() => { });

        const embed = this.embed;
        embed.color = Colors.Green;
        embed.description = t("quiz.characters.correct_description", {
          e,
          locale: this.locale,
          user: author,
          name: this.getCharacterName(character),
          category: this.getCharacterCategory(character),
          artwork: this.getCharacterArtwork(character),
          time: time(this.dateRoundTime, "R")
        });

        if (!embed.fields)
          embed.fields = [];

        const ranking = this.ranking;
        if (ranking.length)
          embed.fields[0] = {
            name: t("quiz.flags.ranking_name", this.locale),
            value: ranking
          };

        await this.message.edit({ embeds: [embed] }).catch(this.error.bind(this));

        setTimeout(async () => await this.newKeyboardRound(), this.roundTime - 2000);
        return;
      })
      .on("end", async (_, reason): Promise<any> => {
        if (["user", "limit"].includes(reason)) return;
        if (reason === "time") return await this.timeOver(character);

        ChannelsInGame.delete(this.channel.id);
        if (["channelDelete", "guildDelete"].includes(reason))
          return await this.finish();
      });

  }
}