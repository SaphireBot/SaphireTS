import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, Guild, InteractionCollector, LocaleString, Message, StringSelectMenuInteraction, TextChannel, User, time } from "discord.js";
import { ChannelsInGame } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import modals from "../modals";
import Database from "../../database";
const alphabet = Array.from({ length: 26 }).map((_, i) => String.fromCharCode(i + 97));

export const games = new Map<string, Stop>();

const categories = [
  "sport",
  "verb",
  "city",
  "country",
  "profession",
  "color",
  "name",
  "fruit",
  "animal",
  "object",
  "brand",
  "movie/serie",
  "car",
  "famous"
];

export default class Stop {

  //                 category    userId  word
  categories: Record<string, Map<string, string>> = {};

  //                            userId
  participants = new Collection<string, User>();

  //                               userId
  participantsInt = new Collection<string, ButtonInteraction<"cached">>();

  //               userId
  giveup = new Set<string>();
  letter = this.randomLetter;

  wordsVerified = new Set<string>();

  control = {
    underRefresh: false as boolean,
    underRefreshTimeout: undefined as NodeJS.Timeout | undefined,
    gameTimeout: undefined as NodeJS.Timeout | undefined,
    categoryID: {} as Record<number, string>
  };

  declare stop: string;
  declare message: Message<true> | undefined;
  declare _locale: LocaleString;
  declare guild: Guild;
  declare author: User;
  declare channel: TextChannel;
  declare interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>;
  declare collector: InteractionCollector<any> | undefined;
  declare timeRemaing: Date;

  constructor(interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>) {
    this.interactionOrMessage = interactionOrMessage;
    this.guild = interactionOrMessage.guild;
    this.author = ("user" in interactionOrMessage) ? interactionOrMessage.user : interactionOrMessage.author;
    this.channel = interactionOrMessage.channel as TextChannel;
    this.participants.set(this.author.id, this.author);
  }

  randomCategories(quantity: number) {
    if (quantity > categories.length) quantity = categories.length;
    return categories.shuffle().random(quantity);
  }

  get randomLetter() {
    return alphabet.random();
  }

  get locale() {
    if (this._locale) return this._locale;

    if (this.interactionOrMessage instanceof ChatInputCommandInteraction) {
      const locale = this.interactionOrMessage.options.getString("locale") as LocaleString | null;
      if (locale) {
        this._locale = locale;
        return locale;
      }
    }

    const locale = this.guild.preferredLocale || this.interactionOrMessage.userLocale;
    if (locale) {
      this._locale = locale || "pt-BR";
      return locale;
    }
  }

  async start() {

    if (ChannelsInGame.has(this.channel.id))
      return await this.reply({
        content: t("stop.channel_already_in_use", { e, locale: this.locale })
      });

    ChannelsInGame.add(this.channel.id);
    games.set(this.channel.id, this);
    return await this.showChooseCategories();
  }

  async showChooseCategories() {
    this.message = await this.reply({
      embeds: [{
        color: Colors.Blue,
        title: t("stop.embed.title", { e, locale: this.locale }),
        description: t("stop.awaiting_categories", { e, locale: this.locale })
      }],
      components: this.chooseComponents,
      fetchReply: true
    });
    return this.enableCategoriesCollectors();
  }

  get embed(): APIEmbed {
    if (this.message?.embeds?.[0]?.length)
      return this.message?.embeds?.[0]?.toJSON();
    else return {
      color: Colors.Blue,
      title: t("stop.embed.title", this.locale)
    };
  }

  enableCategoriesCollectors() {
    if (!this.message) return this.clear();

    this.collector = this.message.createMessageComponentCollector({
      filter: int => int.user.id === this.author.id,
      idle: (1000 * 60) * 2
    })
      .on("collect", async (int: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached">): Promise<any> => {

        const customId = int instanceof ButtonInteraction
          ? int.customId
          : int.values[0];

        if (customId === "start")
          return await this.awaitingParticipants();

        if (customId === "fast_category")
          return await int.update({
            embeds: [this.selectFastCategory()],
            components: this.chooseComponents
          });

        if (customId === "custom_category") {
          const data = await Database.getUser(this.author.id);
          const categories = data?.Stop?.categories || [];
          return await int.showModal(modals.editStopPersonalCategories(categories, this.locale as LocaleString));
        }

        if (customId === "edit_category")
          return await int.showModal(modals.editStopCategories(Object.keys(this.categories), this.locale as LocaleString));

      })
      .on("end", async (_, reason: string): Promise<any> => {
        this.collector = undefined;
        if (reason === "user") return;
        if (
          [
            "time",
            "messageDelete",
            "channelDelete"
          ].includes(reason)
        ) return this.clear();
      });

  }

  selectFastCategory(): APIEmbed {
    this.categories = {};
    const embed = this.embed;
    embed.description = this.randomCategories(10).map(cat => {
      const translate = `${t(`stop.category.${cat}`, this.locale)}`;
      this.categories[translate] = new Map();
      return translate;
    }).join("\n");
    embed.description += `\n \n${t("stop.awaiting_categories", { e, locale: this.locale })}`;
    return embed;
  }

  clear() {
    ChannelsInGame.delete(this.channel.id);
    games.delete(this.channel.id);
  }

  async reply(
    data
      : { content?: string | null, embeds?: APIEmbed[], components?: any[], fetchReply?: boolean }
  ) {

    if (!Object.keys(data)?.length) return;

    if (this.interactionOrMessage instanceof ChatInputCommandInteraction)
      if (
        this.interactionOrMessage.replied
        || this.interactionOrMessage.deferred
      ) return await this.interactionOrMessage.editReply(data as any); // .catch(() => { });
      else return await this.interactionOrMessage.reply(data as any);

    if (this.interactionOrMessage instanceof Message)
      return await this.interactionOrMessage.reply(data as any);
  }

  get chooseComponents() {
    const selectMenu = {
      type: 1,
      components: [{
        type: 3,
        custom_id: "menu",
        placeholder: t("stop.select_menu.placeholders.0", this.locale),
        options: [
          {
            label: t("stop.select_menu.options.0", this.locale),
            emoji: "📝",
            description: t("stop.select_menu.descriptions.0", this.locale),
            value: "fast_category"
          },
          {
            label: t("stop.select_menu.options.1", this.locale),
            emoji: "⭐",
            description: t("stop.select_menu.descriptions.1", this.locale),
            value: "custom_category"
          }
        ]
      }]
    };

    const buttons = {
      type: 1,
      components: [
        {
          type: 2,
          label: t("stop.buttons.labels.0", this.locale),
          custom_id: "start",
          emoji: e.amongusdance,
          style: ButtonStyle.Success,
          disabled: Object.keys(this.categories).length < 3
        },
        {
          type: 2,
          label: t("stop.buttons.labels.1", this.locale),
          custom_id: "edit_category",
          emoji: e.Animated.SaphireReading,
          style: ButtonStyle.Primary
        },
        {
          type: 2,
          label: t("keyword_cancel", this.locale),
          custom_id: JSON.stringify({ c: "delete", uid: this.author.id }),
          emoji: "✖️",
          style: ButtonStyle.Danger
        }
      ]
    };

    return [selectMenu, buttons];
  }

  async awaitingParticipants() {
    this.collector?.stop();
    if (!this.message) return;

    const embed = this.participantsEmbeds;
    embed.description = Object.keys(this.categories)
      .map((cat, i) => `${this.num(i + 1)}. ${t(`stop.category.${cat}`, this.locale)} -> 0/0`).join("\n");
    await this.message.delete().catch(() => { });

    this.message = await this.channel.send({
      embeds: [embed],
      components: this.participantsComponents
    });

    const collector = this.message.createMessageComponentCollector({
      filter: () => true,
      time: 1000 * 60 * 2
    })
      .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

        const { user, customId, userLocale: locale } = int;

        if (customId === "join") {
          if (this.participants.has(user.id))
            return await int.reply({
              content: t("stop.you_already_in", { e, locale }),
              ephemeral: true
            });

          this.refreshParticipants();
          this.participants.set(user.id, user);
          this.participantsInt.set(user.id, int);
          return await int.reply({
            content: t("stop.welcome", { e, locale }),
            ephemeral: true
          });
        }

        if (customId === "leave") {
          if (!this.participants.has(user.id))
            return await int.reply({
              content: t("stop.you_already_out", { e, locale }),
              ephemeral: true
            });

          this.refreshParticipants();
          this.participants.delete(user.id);
          this.participantsInt.delete(user.id);
          return await int.reply({
            content: t("stop.bye_bye", { e, locale, user }),
            ephemeral: true
          });
        }

        if (customId === "start") {
          if (user.id !== this.author.id)
            return await int.reply({
              content: t("stop.you_cannot_click_here", { e, locale: this.locale }),
              ephemeral: true
            });
          collector.stop();
          this.participantsInt.set(user.id, int);
          return await this.inicialize();
        }

      })
      .on("end", async (_, reason: string): Promise<any> => {
        if (reason === "user") return;
        if (
          [
            "time",
            "messageDelete",
            "channelDelete"
          ].includes(reason)
        ) return this.clear();
      });

    return;
  }

  refreshParticipants() {
    if (this.control.underRefresh) return;
    this.control.underRefresh = true;

    this.control.underRefreshTimeout = setTimeout(async () => {
      this.control.underRefresh = false;
      if (!this.message) return;
      await this.message.edit({
        embeds: [this.participantsEmbeds],
        components: this.participantsComponents
      })
        .catch(() => { });
    }, 1700);

    return;
  }

  get participantsEmbeds() {
    const embed = this.embed;

    embed.fields = [];
    embed.fields[0] = {
      name: t("stop.embed.fields.0.name", { locale: this.locale, size: this.participants.size }),
      value: this.participants
        .valuesToArray()
        .join("\n")
        || t("stop.embed.fields.0.value", { e, locale: this.locale })
    };

    return embed;
  }

  get participantsComponents() {
    return [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("stop.buttons.labels.4", {
              locale: this.locale,
              size: this.participants.size > 3 ? 3 : this.participants.size
            }),
            custom_id: "start",
            style: ButtonStyle.Success,
            emoji: e.amongusdance,
            disabled: this.participants.size < 3
          },
          {
            type: 2,
            label: t("stop.buttons.labels.2", this.locale),
            custom_id: "join",
            emoji: e.NezukoDance,
            style: ButtonStyle.Primary,
            disabled: this.participants.size >= 30
          },
          {
            type: 2,
            label: t("stop.buttons.labels.3", this.locale),
            custom_id: "leave",
            emoji: "🏃‍♂️",
            style: ButtonStyle.Primary
          },
          {
            type: 2,
            label: t("keyword_cancel", this.locale),
            emoji: "✖️",
            custom_id: JSON.stringify({ c: "delete", uid: this.author.id }),
            style: ButtonStyle.Danger
          }
        ]
      }
    ].asMessageComponents();
  }

  num(n: number): string {
    return n <= 9 ? "0" + `${n}` : `${n}`;
  }

  async inicialize() {

    await this.message?.delete().catch(() => { });
    setTimeout(async () => await this.lauch(), 1000 * 10);

    this.message = await this.channel.send({
      content: t("stop.pay_attention_and_good_luck", {
        e,
        locale: this.locale,
        letter: this.letter.toUpperCase()
      })
    });

    Object.keys(this.categories)
      .map((str, i) => this.control.categoryID[i] = str);
  }

  async lauch() {
    await this.message?.delete().catch(() => { });
    this.timeRemaing = new Date(Date.now() + (1000 * 60 * 5));

    this.message = await this.channel.send({
      embeds: this.gameEmbed,
      components: this.gameComponent
    });

    const collector = this.message.createMessageComponentCollector({
      filter: () => true,
      time: 1000 * 60 * 5
    })
      .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

        const { user, customId } = int;

        if (!this.participants.has(int.user.id))
          return await int.reply({
            content: t("stop.you_already_out", { e, locale: this.locale }),
            ephemeral: true
          });

        this.participantsInt.set(user.id, int);

        if (customId === "reply")
          return await this.replyMessage(int);

        if (customId === "stop") {
          for await (const opt of Object.values(this.categories))
            if (!opt.has(user.id))
              return await int.reply({
                content: t("stop.you_cant_stop", { e, locale: this.locale }),
                ephemeral: true
              });

          collector.stop("user");
          this.stop = int.user.id;
          return await this.STOP(int);
        }

        if (customId === "giveup") {
          if (this.giveup.has(user.id))
            this.giveup.delete(user.id);
          else this.giveup.add(user.id);

          if (
            (Math.ceil(this.participants.size / 2) + 1) >= this.giveup.size
          ) {
            collector.stop();
            this.clear();
            await this.message?.delete().catch(() => { });
            await this.channel.send({
              content: t("stop.giveup_success")
            });
          }

          return await int.update({ components: this.gameComponent });
        }

      })
      .on("end", async (_, reason): Promise<any> => {
        if (reason === "user") return;
        if (reason === "messageDelete")
          return this.message = await this.channel.send({
            embeds: this.gameEmbed,
            components: this.gameComponent
          });

        if (
          [
            "channelDelete",
            "guildDelete"
          ].includes(reason)
        ) return this.clear();
      });

    for (const int of this.participantsInt.values())
      this.replyMessage(int);

    return;
  }

  async STOP(int: ButtonInteraction<"cached">) {
    await this.message?.delete().catch(() => { });

    this.message = await this.channel.send({
      content: t("stop.STOP!", { e, locale: this.locale, username: int.member.displayName })
    });

    const words: { category: string, word: string }[] = [];

    for (const [category, options] of Object.entries(this.categories))
      for (const word of Array.from(new Set(options.values())))
        words.push({ category, word });

    await sleep(2000);

    return await this.validateWords(words);
  }

  async validateWords(data: { category: string, word: string }[]) {

    await this.message?.delete().catch(() => { });
    let i = 0;
    const validade = async (): Promise<any> => {

      await this.message?.delete().catch(() => { });

      if (!data[i])
        return await this.calculatePoints();

      const { category, word } = data[i];

      const control = {
        yes: new Set<string>(),
        no: new Set<string>()
      };

      this.message = await this.reply({
        content: t("stop.word_exist", {
          e,
          locale: this.locale,
          word: word.toUpperCase(),
          time: time(new Date(Date.now() + (1000 * 10)), "R"),
          category
        }),
        components: this.validadeButton(0, 0)
      });

      const collector = this.message?.createMessageComponentCollector({
        filter: int => this.participants.has(int.user.id),
        time: 9000
      })
        .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

          const { customId, user } = int;

          if (customId === "yes") {
            control.yes.add(user.id);
            control.no.delete(user.id);
          } else {
            control.yes.delete(user.id);
            control.no.add(user.id);
          }

          if (
            (control.yes.size + control.no.size) >= this.participants.size
          ) return collector?.stop();

          return await int.update({
            components: this.validadeButton(control.yes.size, control.no.size)
          });
        })
        .on("end", async () => {
          // POR FAVOR MEU DEUS, CONFIO EM TI
          // if (!["time", "user"].includes(reason)) {
            if (control.yes.size >= control.no.size)
              this.wordsVerified.add(word);
            i++;
            return await validade();
          // }
        });
    };

    return await validade();
  }

  async calculatePoints() {

    this.message = await this.reply({
      content: t("stop.validation_complete", { e, locale: this.locale })
    });

    //                   userId  points
    const points: Record<string, number> = {};

    for (const userId of this.participants.keys())
      points[userId] = 0;

    for (const [_, options] of Object.entries(this.categories)) {
      const wordsRepeat: Record<string, number> = {};

      for (const w of Array.from(options.values()))
        wordsRepeat[w] = this.wordsVerified.has(w) ? (wordsRepeat[w] || 0) + 1 : 0;

      for (const [userId, word] of options.entries())
        points[userId] += (
          wordsRepeat[word] === 0
            ? 0
            : wordsRepeat[word] === 1 ? 10 : 5);
    }

    await sleep(4000);
    return await this.sendPoints(points);
  }

  async sendPoints(points: Record<string, number>) {

    await this.message?.delete().catch(() => { });
    ChannelsInGame.delete(this.channel.id);

    return await this.channel.send({
      embeds: [{
        color: Colors.Blue,
        title: t("stop.embed.title", this.locale),
        description: Object.entries(points)
          .sort((a, b) => b[1] - a[1])
          .map(([userId, point]) => {
            const user = this.participants.get(userId);
            return t("stop.points", { user, locale: this.locale, point });
          })
          .join("\n")
          .limit("EmbedDescription")
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("stop.table", this.locale),
              custom_id: JSON.stringify({ c: "stop", src: "table" }),
              emoji: "📑",
              style: ButtonStyle.Primary
            }
          ]
        }
      ].asMessageComponents()
    });

  }

  async table(int: ButtonInteraction<"cached">) {

    const { userLocale: locale } = int;
    const embeds: APIEmbed[] = [];

    await int.reply({
      content: t("stop.mapping", { e, locale }),
      ephemeral: true
    });

    for (const user of this.participants.values()) {
      embeds.push({
        color: Colors.Blue,
        title: `${t("stop.embed.title", locale)} | ${user.username}`,
        description: Object.entries(this.categories)
          .map(([cat, opt], i) => `${this.num(i + 1)}. ${t(`stop.category.${cat}`, locale)}: ${opt.get(user.id) || ""}`)
          .join("\n")
          .limit("EmbedDescription")
      });
    }

    if (!embeds.length)
      return await int.editReply({ content: t("stop.nothing_found", { e, locale }) });

    await int.editReply({
      content: null,
      embeds: embeds.slice(0, 10)
    });

    for (let i = 10; i < embeds.length; i += 10)
      int.followUp({
        embeds: embeds.slice(i, i + 10)
      });

    return;
  }

  validadeButton(yes: number, no: number) {
    return [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("stop.yes", { locale: this.locale, yes }),
            emoji: "⭐",
            custom_id: "yes",
            style: ButtonStyle.Success
          },
          {
            type: 2,
            label: t("stop.no", { locale: this.locale, no }),
            emoji: "✖️",
            custom_id: "no",
            style: ButtonStyle.Danger
          },
        ]
      }
    ].asMessageComponents();
  }

  async replyMessage(int: ButtonInteraction<"cached">) {
    const data = {
      embeds: [{
        color: Colors.Blue,
        title: t("stop.embed.title", int.locale),
        description: Object.entries(this.categories)
          .map(([cat, opt], i) => {
            const response = opt.get(int.user.id) || "";
            return `${this.num(i + 1)}. ${t(`stop.category.${cat}`, this.locale)}: ${response}`;
          })
          .join("\n")
          .limit("EmbedDescription")
      }],
      components: this.replyMessageComponents,
      ephemeral: true
    };

    return int.replied
      ? await int.followUp(data)
      : await int.reply(data);
  }

  get replyMessageComponents() {

    const buttons = {
      type: 1,
      components: [] as any[]
    };

    for (let i = 0; i < Object.keys(this.categories).length; i += 5) {
      const x = (i + 5) > Object.keys(this.categories).length ? Object.keys(this.categories).length : i + 5;
      buttons.components.push({
        type: 2,
        label: `${i + 1}...${x}`,
        custom_id: JSON.stringify({ c: "stop", src: "reply", id: `${i}.${x}` }),
        style: ButtonStyle.Primary
      });
    }

    return [buttons];
  }

  async gameRefresh() {
    await this.message?.edit({
      embeds: this.gameEmbed,
      components: this.gameComponent
    });
  }

  get gameEmbed(): APIEmbed[] {
    return [{
      color: Colors.Blue,
      title: t("stop.embed.title", this.locale),
      description: Object.entries(this.categories)
        .map(([cat, opt], i) => `${this.num(i + 1)}. ${t(`stop.category.${cat}`, this.locale)}: ${opt.size}/${this.participants.size}`)
        .join("\n"),
      fields: [
        {
          name: t("stop.embed.fields.1.name", this.locale),
          value: `${time(this.timeRemaing, "R")}\n${t("stop.letter", { locale: this.locale, letter: this.letter.toUpperCase() })}`
        }
      ]
    }];
  }

  get gameComponent() {
    return [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "STOP!",
            emoji: "☝️",
            custom_id: "stop",
            style: ButtonStyle.Success
          },
          {
            type: 2,
            label: t("stop.reply", this.locale),
            emoji: "📝",
            custom_id: "reply",
            style: ButtonStyle.Primary
          },
          {
            type: 2,
            label: t("stop.giveup", {
              locale: this.locale,
              ceil: Math.ceil(this.participants.size / 2),
              giveup: this.giveup.size
            }),
            emoji: "🏳️",
            custom_id: "giveup",
            style: ButtonStyle.Danger
          }
        ]
      }
    ];
  }

}