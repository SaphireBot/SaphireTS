import {
  APIEmbed,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  ComponentType,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  LocaleString,
  Message,
  StringSelectMenuInteraction,
  TextChannel,
  User,
  parseEmoji,
  time,
} from "discord.js";
import flagsJSON from "../../../JSON/flags.json";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { mapButtons } from "djs-protofy";
import { ChannelsInGame, KeyOfLanguages, urls } from "../../../util/constants";
import Database from "../../../database";
export const allFlags = Object.entries(flagsJSON);
type flagsJSONKeys = keyof typeof flagsJSON;
type flagsJSONValues = (typeof flagsJSON)[flagsJSONKeys];
type Interaction = ChatInputCommandInteraction | Message | StringSelectMenuInteraction;

export default class FlagQuiz {

  rounds = 0;
  points: Record<string, number> = {};
  players = new Map<string, GuildMember>();

  declare flags: Collection<flagsJSONKeys, flagsJSONValues>;
  declare readonly interaction: Interaction;
  declare readonly channel: GuildTextBasedChannel;
  declare readonly user: User;
  declare readonly guild: Guild | null;
  declare _locale: LocaleString;
  declare message: Message | void;
  declare timeStyle: "normal" | "fast" | undefined;
  declare gameStyle: "solo" | "party" | undefined;

  constructor(interaction: Interaction) {
    this.interaction = interaction;
    this.channel = interaction.channel as TextChannel;
    this.user = interaction instanceof Message ? interaction.author : interaction.user;
    this.guild = interaction.guild;
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
    return this.message?.embeds?.[0]?.toJSON()
      || {
      color: Colors.Blue,
      title: t("quiz.flags.title", { client, locale: this.locale }),
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

  async checkIfChannelIsUsed() {
    if (ChannelsInGame.has(this.channel.id)) {
      const content = t("quiz.flags.channel_used", { e, locale: this.locale });

      return this.interaction instanceof Message
        ? await this.interaction.reply({ content })
          .then(msg => setTimeout(() => msg.delete().catch(() => { }), 4000))
        : await this.interaction.reply({
          content,
          ephemeral: true,
        });
    }

    ChannelsInGame.add(this.channel.id);
    return await this.chooseGameStyle();
  }

  async chooseGameStyle() {

    if (this.interaction instanceof ChatInputCommandInteraction) {
      this.gameStyle = this.interaction.options.getString("mode")! as "solo" | "party" | undefined;
      if (this.gameStyle) return await this.chooseTypeStyle(this.interaction);
    }

    const locale = this.locale;
    console.log(locale);
    const payload: any = {
      content: null,
      fetchReply: true,
      embeds: [{
        color: Colors.Blue,
        title: t("quiz.flags.title", { locale, client }),
        description: t("quiz.choose_mode", { e, locale }),
        fields: [
          {
            name: t("quiz.flags.fields.modes.0.name", locale),
            value: t("quiz.flags.fields.modes.0.value", locale),
          },
          {
            name: t("quiz.flags.fields.modes.1.name", { e, locale }),
            value: t("quiz.flags.fields.modes.1.value", locale),
          },
        ],
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              emoji: e.Commands,
              label: t("quiz.flags.buttons.solo", locale),
              custom_id: "solo",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: e.typing,
              label: t("quiz.flags.buttons.party", locale),
              custom_id: "party",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: e.DenyX,
              label: t("quiz.flags.buttons.cancel", locale),
              custom_id: "cancel",
              style: ButtonStyle.Danger,
            },
          ],
        },
      ].asMessageComponents(),
    };

    this.message = this.interaction instanceof StringSelectMenuInteraction
      ? await this.interaction.update(payload)
      : await this.interaction.reply(payload) as any;

    if (!this.message) return await this.error("Origin message not found");
    const collector = this.message.createMessageComponentCollector({
      filter: int => int.user.id === this.user.id,
      time: 1000 * 30,
    })
      .on("collect", async (int: ButtonInteraction): Promise<any> => {
        const customId = int.customId as "cancel" | "solo" | "party";
        if (customId === "cancel") return await this.cancel(int);

        collector.stop();
        this.gameStyle = customId;
        return await this.chooseTypeStyle(int);
      })
      .on("end", async (_, reason: string): Promise<any> => {
        if (reason === "user") return;
        return await this.cancel();
      });

    return;
  }

  async chooseTypeStyle(int: ButtonInteraction | ChatInputCommandInteraction) {

    this.timeStyle = this.interaction instanceof ChatInputCommandInteraction
      ? this.interaction.options.getString("style") as "normal" | "fast" || "normal"
      : "normal";

    if (this.interaction instanceof ChatInputCommandInteraction) {
      const mode = this.interaction.options.getString("answers") as "alternatives" | "keyboard" | null;
      if (mode) {
        this.flags = new Collection<any, any>(allFlags);

        const data: any = {
          content: t("quiz.flags.loading_flags", { e, locale: this.locale }),
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

    const locale = this.locale;
    const data: any = {
      content: undefined,
      fetchReply: true,
      embeds: [{
        color: Colors.Blue,
        title: t("quiz.flags.title", { locale, client }),
        description: t("quiz.choose_type", { e, locale }),
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              emoji: e.Commands,
              label: t("quiz.flags.buttons.alternatives", locale),
              custom_id: "alternatives",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: e.typing,
              label: t("quiz.flags.buttons.keyboard", locale),
              custom_id: "keyboard",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: e.DenyX,
              label: t("quiz.flags.buttons.cancel", locale),
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
        this.flags = new Collection<any, any>(allFlags);
        if (!this.message) return await this.error("Origin message not found");

        await this.message.edit({
          content: t("quiz.flags.loading_flags", { e, locale: this.locale }),
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

  async cancel(interaction?: ButtonInteraction) {
    ChannelsInGame.delete(this.channel.id);

    const payload = {
      content: t("quiz.flags.cancelled", { e, locale: this.locale }),
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

  async newAlternativeRound() {
    if (!this.message) return await this.error("Origin message not found");

    this.rounds++;
    await this.deleteMessage();

    const flag = this.getFlag();
    if (!flag) return await this.noFlagsAvailable();
    const { key, langs } = flag;
    const embed = this.buildMatchEmbed(key);
    const buttons = this.generateButtons(key, langs[this.locale as keyof flagsJSONValues]);

    this.message = await this.channel.send({
      embeds: [embed],
      components: buttons.asMessageComponents(),
    })
      .catch(this.error.bind(this));

    if (!this.message) return;
    return await this.enableAlternativeCollector(key);
  }

  async newKeyboardRound() {
    if (!this.message) return await this.error("Origin message not found");

    this.rounds++;
    await this.deleteMessage();

    const flag = this.getFlag();
    if (!flag) return await this.noFlagsAvailable();
    const { key, langs } = flag;
    const embed = this.buildMatchEmbed(key);
    const answers = Object.values(langs).flat().map(str => str.toLowerCase());

    this.message = await this.channel.send({ embeds: [embed] })
      .catch(this.error.bind(this));

    if (!this.message) return;
    return await this.enableKeyboardCollector(key, answers);
  }

  async enableKeyboardCollector(key: flagsJSONKeys, answers: string[]) {

    return this.channel.createMessageCollector({
      filter: msg => this.filter(msg) && answers.includes(msg.content?.toLowerCase()),
      time: this.roundTime,
      max: 1,
    })
      .on("collect", async (message): Promise<any> => {
        if (!this.message) return await this.error("Origin message not found");

        const { author } = message;
        await message.react("⭐").catch(() => { });
        const countryName = this.getCountryName(key);

        const embed = this.embed;
        embed.color = Colors.Green;
        embed.description = t("quiz.flags.correct_description", {
          e,
          locale: this.locale,
          user: author,
          countryName,
          time: time(this.dateRoundTime, "R"),
        });

        if (!embed.fields)
          embed.fields = [];

        const ranking = this.ranking;
        if (ranking.length)
          embed.fields[0] = {
            name: t("quiz.flags.ranking_name", this.locale),
            value: ranking,
          };

        await this.message.edit({ embeds: [embed] }).catch(this.error.bind(this));

        setTimeout(async () => await this.newKeyboardRound(), this.roundTime - 500);
        return;
      })
      .on("end", async (_, reason): Promise<any> => {
        if (["user", "limit"].includes(reason)) return;
        if (reason === "time") return await this.timeOver(key);

        ChannelsInGame.delete(this.channel.id);
        if (["channelDelete", "guildDelete"].includes(reason))
          return await this.finish();
      });

  }

  addPoint(userId: string) {
    return this.points[userId] ? this.points[userId]++ : this.points[userId] = 1;
  }

  filter(int: ButtonInteraction | Message): boolean {
    const user = int instanceof ButtonInteraction ? int.user : int.author;
    return this.gameStyle === "solo" ? user.id === this.user.id : true;
  }

  async enableAlternativeCollector(key: flagsJSONKeys) {
    if (!this.message) return await this.error("Origin message not found");

    const alreadyAnswers = new Set<string>();

    const collector = this.message.createMessageComponentCollector({
      filter: this.filter,
      time: this.roundTime,
      componentType: ComponentType.Button,
    })
      .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

        const { user, userLocale: locale, member } = int;
        const customId = int.customId as flagsJSONKeys;

        if (alreadyAnswers.has(user.id))
          return await int.reply({
            content: t("quiz.flags.already_answer", { e, locale }),
            ephemeral: true,
          });
        else {
          alreadyAnswers.add(user.id);
          this.players.set(user.id, member);
        }

        const countryName = this.getCountryName(customId);
        if (customId !== key) {
          return await int.reply({
            content: t("quiz.flags.mistake", { e, locale, countryName }),
            ephemeral: true,
          });
        }

        if (customId === key) {
          collector.stop();
          this.addPoint(user.id);
          await this.disableButtonsAndStartNewRound(int, countryName);
          return;
        }

      })
      .on("end", async (_, reason: string): Promise<any> => {
        if (reason === "user") return;
        if (reason === "time") return await this.timeOver(key);

        ChannelsInGame.delete(this.channel.id);
        if (["channelDelete", "guildDelete"].includes(reason))
          return await this.finish();
      });
  }

  async disableButtonsAndStartNewRound(int: ButtonInteraction, countryName: string): Promise<void> {
    if (!this.message) return await this.error("Origin message not found");

    if (!this.flags.size)
      return await this.noFlagsAvailable();

    const { message, customId } = int;
    const { components } = message;

    const buttons = mapButtons(
      components,
      (button) => {
        // if (button.style === ButtonStyle.Link) return button;
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
    embed.description = t("quiz.flags.correct_description", {
      e,
      locale: this.locale,
      user: int.user,
      countryName,
      time: time(this.dateRoundTime, "R"),
    });

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
      components: buttons,
      fetchReply: true,
    }).catch(this.error.bind(this));

    setTimeout(async () => await this.newAlternativeRound(), this.roundTime - 500);
    return;
  }

  async timeOver(key: flagsJSONKeys) {
    await this.finish();
    if (!this.message) return await this.error("Origin message not found");

    const { components } = this.message;
    const embed = this.embed;

    if (!embed.title) embed.title = t("quiz.flags.title", { locale: this.locale, client });
    embed.color = Colors.Red;

    if (!embed.fields)
      embed.fields = [];

    const ranking = this.ranking;
    if (ranking.length)
      embed.fields[0] = {
        name: t("quiz.flags.ranking_name", this.locale),
        value: ranking,
      };

    embed.description = t("quiz.flags.time_over", {
      e,
      locale: this.locale,
      countryName: this.getCountryName(key),
    });

    const buttons = mapButtons(
      components,
      button => {
        button.disabled = true;
        return button;
      },
    );

    await this.deleteMessage();
    return await this.channel.send({
      embeds: [embed],
      components: buttons,
    })
      .catch(() => { });
  }

  getCountryName(flagKey: flagsJSONKeys) {
    return allFlags.find(([key]) => key === flagKey)![1][this.locale as keyof flagsJSONValues][0];
  }

  getFlag() {
    const key = this.flags.randomKey()!;
    if (!key) return;

    const langs = this.flags.get(key);
    if (!langs) return;

    this.flags.delete(key);
    return { key, langs };
  }

  async noFlagsAvailable() {
    await this.finish();
    if (!this.message) return await this.error("Origin message not found");

    const { embeds } = this.message;
    const embed = embeds[0]?.toJSON() || {} as APIEmbed;

    if (!embed.title) embed.title = t("quiz.flags.title", { locale: this.locale, client });
    embed.color = Colors.Red;
    delete embed.image;

    if (!embed.fields)
      embed.fields = [];

    const ranking = this.ranking;
    if (ranking.length)
      embed.fields[0] = {
        name: t("quiz.flags.ranking_name", this.locale),
        value: ranking,
      };

    embed.description = t("quiz.flags.no_flag", {
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

  buildMatchEmbed(key: flagsJSONKeys): APIEmbed {
    return {
      color: Colors.Blue,
      title: t("quiz.flags.title", { e, locale: this.locale, client }),
      description: t("quiz.flags.flag_description", {
        e,
        locale: this.locale,
        time: time(this.dateRoundTime, "R"),
      }),
      image: {
        url: urls.cdn("countries", `${key}.png`),
      },
      footer: {
        text: t("quiz.flags.rounds", { locale: this.locale, rounds: this.rounds, flags: allFlags.length }),
      },
    };
  }

  generateButtons(key: flagsJSONKeys, answersOptions: string[]) {

    const keys = new Set<string>();
    keys.add(key);
    const locale = this.locale as keyof flagsJSONValues;

    function component() {
      const [key, value] = allFlags.random()! || [];
      if (!key) return;

      if (keys.has(key)) {
        if (allFlags.length > 5)
          return component();
        return;
      }

      const name = value[locale][0];
      keys.add(key);

      return {
        type: 2,
        label: name.limit("ButtonLabel"),
        custom_id: key.limit("ButtonCustomId"),
        style: ButtonStyle.Primary,
      };
    }

    return [{
      type: 1,
      components: [
        {
          type: 2,
          label: answersOptions?.[0]?.limit("ButtonLabel") || "??",
          custom_id: key.limit("ButtonCustomId"),
          style: ButtonStyle.Primary,
        },
        component(),
        component(),
        component(),
        component(),
      ]
        .filter(Boolean)
        .shuffle(),
    }];

  }

  async finish() {
    ChannelsInGame.delete(this.channel.id);

    const entries = Object.entries(this.points || {});

    if (entries.length) {
      this.points = {};
      const data = entries
        .map(([id, points]) => ({
          updateOne: {
            filter: { id },
            update: {
              $inc: {
                ["GamingCount.FlagCount"]: points,
              },
            },
            upsert: true,
          },
        }));

      await Database.Users.collection.bulkWrite(data, { ordered: true }).catch(() => { });
    }

  }

  async deleteMessage() {
    if (!this.message) return;
    await this.message.delete().catch(() => { });
  }

  async error(err: Error | string) {
    await this.finish();
    await this.message?.delete().catch(() => { });
    this.message = undefined;
    await this.channel.send({
      content: t("quiz.flags.error", {
        e,
        locale: this.locale,
        err,
      }),
    }).catch(() => { });
    return;
  }
}