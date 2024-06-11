import { ChatInputCommandInteraction, Collection, Guild, User, GuildTextBasedChannel, LocaleString, Message, APIEmbed, Colors, ButtonInteraction, InteractionCollector, ComponentType, time, MessageCollector, APIEmbedField } from "discord.js";
import { ChannelsInGame, KeyOfLanguages } from "../../util/constants";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import { BlackjackCard, BlackjackData, CollectorEnding } from "../../@types/commands";
import Database from "../../database";
import { initialButtons, playButtons } from "./constants";
const deck = e.cards;
type InteractionOrMessage = ChatInputCommandInteraction<"cached"> | Message<true> | undefined;

export default class Blackjack {

  players = new Collection<string, User>();
  playerCards = new Collection<string, BlackjackCard[]>();
  points: Record<string, number> = {};
  standed = new Set<string>();
  deck = [] as BlackjackCard[];
  decksAmount: number = 0;
  defaultDecksAmount = 2;
  maxPlayers = 20;

  controller = {
    timeToRoundEnd: "",
    refreshing: false,
    count: 0,
    refreshingInitialEmbed: false,
    refreshingInitialEmbedTimeout: 0,
    indexToWhoWillPlayNow: 0,
  } as {
    timeToRoundEnd: string
    count: number
    refreshing: boolean
    indexToWhoWillPlayNow: number
    refreshingInitialEmbed: boolean
    refreshingInitialEmbedTimeout: NodeJS.Timeout | 0
  };

  dealerReaction = Math.floor(Math.random() * 10) > 6;
  declare messageDealerReaction: Message | undefined;

  declare message: Message | void;
  declare _locale: LocaleString;
  declare interactionOrMessage: InteractionOrMessage;
  declare channel: GuildTextBasedChannel | null;
  declare channelId: string | undefined;
  declare guild: Guild | undefined;
  declare guildId: string | undefined;
  declare author: User | undefined;
  declare authorId: string | undefined;
  declare options: BlackjackData;
  declare pathname: string;
  declare lastMessageId: string | undefined;
  declare playNow: User | undefined;
  declare playingNowId: string | undefined;
  declare started: boolean;
  declare collector: InteractionCollector<ButtonInteraction> | undefined;
  declare messageCollector: MessageCollector | undefined;
  declare _value: number | null;

  constructor(interactionOrMessage: InteractionOrMessage, options: BlackjackData) {
    this.interactionOrMessage = interactionOrMessage;
    this.options = options;

    if (
      typeof interactionOrMessage?.channelId === "string"
      || typeof options.channelId === "string"
    ) {
      this.channelId = interactionOrMessage?.channelId || options.channelId;
      if (this.channelId) ChannelsInGame.add(this.channelId);
    }

    if (
      typeof interactionOrMessage?.guildId === "string"
      || typeof options.guildId === "string"
    )
      this.guildId = interactionOrMessage?.guildId || options.guildId;

    this.load();
  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (this.interactionOrMessage instanceof Message)
      for (const arg of this.interactionOrMessage.content?.split(" ") || [] as string[])
        if (KeyOfLanguages[arg as keyof typeof KeyOfLanguages]) {
          this._locale = KeyOfLanguages[arg as keyof typeof KeyOfLanguages] as LocaleString;
          return this._locale;
        }

    if (this.interactionOrMessage instanceof ChatInputCommandInteraction) {
      this._locale = this.interactionOrMessage.options.getString("language") as LocaleString
        || this.interactionOrMessage.guild?.preferredLocale
        || client.defaultLocale;
      return this._locale;
    }

    this._locale = this.interactionOrMessage?.guild?.preferredLocale
      || this.interactionOrMessage?.userLocale
      || client.defaultLocale as LocaleString;

    return this._locale;
  }

  get title() {
    return t("blackjack.embed.title", {
      locale: this.locale,
      client,
      card1: deck.random()!.emoji,
      card2: deck.random()!.emoji
    });
  }

  get playersDescription() {
    return this.players
      .map(user => {
        const playerCards = this.playerCards.get(user.id) || [];
        let cardsToString = playerCards.map(card => card.emoji).join("");

        if (cardsToString.length)
          cardsToString = ` - ${cardsToString}`;

        return `👤 ${user} - ${this.getUserPoint(user.id)}/21${cardsToString}`;
      })
      .join("\n")
      .limit("EmbedDescription")
      || t("blackjack.awaiting_players", { e, locale: this.locale });
  }

  get fields(): APIEmbedField[] {
    const fields = [
      this.playNow
        ? {
          name: t("blackjack.embed.fields.play.name", { e, locale: this.locale }),
          value: t("blackjack.embed.fields.play.value", {
            locale: this.locale,
            user: this.playNow,
            time: this.controller.timeToRoundEnd
          })
        }
        : {
          name: t("blackjack.embed.fields.config.name", { e, locale: this.locale }),
          value: t("blackjack.embed.fields.config.value", {
            locale: this.locale,
            decksAmount: this.decksAmount
          })
        }
    ];

    if (this.value > 0)
      fields.push({
        name: t("crash.embed.fields.0.name", { e, locale: this.locale }),
        value: t("race.embed.fields.0.value", { e, locale: this.locale, value: this.value.currency() })
      });

    return fields;
  }

  get embed(): APIEmbed {
    return {
      color: Colors.Blue,
      title: this.title,
      description: this.playersDescription,
      fields: this.fields
    };
  }

  get value() {
    if (typeof this._value === "number") return this._value;
    return 0;
  }

  async load() {

    this._locale = this.locale;
    this.started = this.options.started || false;

    if (this.options.decksAmount)
      this.decksAmount = this.options.decksAmount;

    if (!this.decksAmount && this.interactionOrMessage instanceof ChatInputCommandInteraction)
      this.decksAmount = this.interactionOrMessage.options.getInteger("decks") || this.defaultDecksAmount;

    if (!this.decksAmount)
      this.decksAmount = this.defaultDecksAmount;

    if (this.options.deck?.length)
      this.deck = this.options.deck;

    this.controller.indexToWhoWillPlayNow = this.options.indexToWhoWillPlayNow || 0;

    if (typeof this.options.value === "number")
      if (this.options.value > 0) this._value = this.options.value;

    if (this.interactionOrMessage instanceof ChatInputCommandInteraction)
      this._value = this.interactionOrMessage.options.getInteger("amount") || 0;

    this.authorId = this.options.authorId
      || (
        this.interactionOrMessage
          ? "user" in this.interactionOrMessage ? this.interactionOrMessage.user.id : this.interactionOrMessage?.author.id
          : undefined
      );

    if (this.authorId)
      this.author = await client.users.fetch(this.authorId)?.catch(() => undefined);

    if (!this.guildId)
      this.guildId = this.guildId || this.options.guildId || this.interactionOrMessage?.guildId;

    if (this.guildId)
      this.guild = client.guilds.getById(this.guildId)
        || await client.guilds.fetch(this.guildId).catch(() => undefined);

    if (this.channelId && this.guild)
      this.channel = this.guild.channels.getById(this.channelId) as GuildTextBasedChannel || await this.guild.channels.fetch(this.channelId).catch(() => null);

    if (!this.guildId && this.guild)
      this.guildId = this.guild.id;

    if (!this.channelId && this.channel)
      this.channelId = this.channel.id;

    if (!this.guild || !this.guildId || !this.channel || !this.channelId || !this.author)
      return await this.corruptedInformation();

    if (this.options.players?.length) {
      const players = await Promise.all(this.options.players.map(id => client.users.fetch(id).catch(() => undefined)));
      for (const player of players)
        if (player)
          this.players.set(player.id, player);

      if (this.options.players.length !== this.players.size)
        return await this.corruptedInformation();
    }

    if (this.options.standed) this.standed = new Set(this.options.standed);

    if (
      this.options.playerCards
      && Object.keys(this.options.playerCards || {}).length
    )
      for (const [userId, cards] of Object.entries(this.options.playerCards))
        if (this.players.has(userId)) {
          this.points[userId] = cards.reduce((pre, curr) => pre += curr.value, 0);
          this.playerCards.set(userId, cards);
        }

    if (this.options.playingNowId) {
      this.playNow = await client.users.fetch(this.options.playingNowId).catch(() => undefined);
      if (!this.playNow) return await this.corruptedInformation();
    }

    ChannelsInGame.add(this.channelId);
    this.pathname = `Blackjack.${this.guildId}.${this.channelId}`;

    if (this.options.lastMessageId) {
      const msg = await this.channel.messages.fetch(this.options.lastMessageId).catch(() => { });
      if (msg) await msg.delete();
    }

    this.messageCollectorControl();

    if (this.players.size) {
      if (this.playingNowId && this.playNow) {

        if (this.standed.has(this.playingNowId))
          this.clearTurn();

        return await this.newTurn(this.playNow);
      }
      return await this.start(true);
    }
    return await this.init();
  }

  messageCollectorControl(): any {

    this.messageCollector = this.channel?.createMessageCollector({
      filter: () => true
    })
      .on("collect", async message => {

        if (
          message.author.id === client.user?.id
          || this.controller.refreshing
          || this.controller.count > 7
        ) return;

        if (message.attachments.size)
          this.controller.count += 3 * message.attachments.size;

        if (message.embeds.length)
          this.controller.count += 3 * message.embeds.length;

        if (message.components.length)
          this.controller.count += message.components.length;

        if (message.content?.length)
          this.controller.count++;

        if (this.controller.count >= 7) {
          this.controller.refreshing = true;

          if (!this.message) {
            this.controller.count = 0;
            this.controller.refreshing = false;
            return;
          }

          if (this.started) {
            this.collector?.stop("refresh");
            await this.editOrSendMessage();
            this.playCollector();
            this.controller.count = 0;
            this.controller.refreshing = false;
            return;
          }

          const embed = this.message.embeds?.[0]?.toJSON();
          const components = this.message.components;
          this.collector?.stop();
          await this.message.delete().catch(() => { });
          this.message = undefined;

          const msg = await this.channel?.send({
            embeds: [embed],
            components
          }).catch(() => null);

          this.controller.count = 0;
          this.controller.refreshing = false;
          if (msg) {
            this.message = msg;
            if (msg) this.lastMessageId = msg.id;
            this.initialCollector();
          }
        }

        return;
      })
      .on("end", () => {
        this.controller.count = 0;
        this.controller.refreshing = false;
      });
    return;
  }

  async save() {

    const playerCards: Record<string, BlackjackCard[]> = {};

    for (const [userId, cards] of this.playerCards.entries())
      playerCards[userId] = cards;

    await Database.Games.set(
      this.pathname,
      {
        channelId: this.channelId,
        authorId: this.authorId,
        decksAmount: this.decksAmount,
        guildId: this.guildId,
        lastMessageId: this.lastMessageId,
        players: Array.from(this.players.keys()),
        playingNowId: this.playingNowId,
        points: this.points,
        started: this.started,
        indexToWhoWillPlayNow: this.controller.indexToWhoWillPlayNow,
        eliminated: Array.from(this.standed),
        playerCards,
        deck: this.deck,
        value: this.value
      } as BlackjackData
    );
  }

  async init() {

    if (!this.channel || !this.channelId) return await this.corruptedInformation();

    this.message = await this.reply({
      embeds: [this.embed],
      components: initialButtons(this.locale, this.players.size, this.maxPlayers)
    });

    if (!this.message) return await this.failed();

    this.lastMessageId = this.message.id;
    this.players.set(client.user!.id, client.user!);

    await this.save();
    return await this.initialCollector();
  }

  async failed() {
    await this.delete();
    return await this.reply({
      content: t("blackjack.failed", { e, locale: this.locale })
    });
  }

  async initialCollector() {

    if (!this.message) return await this.failed();

    this.collector = this.message.createMessageComponentCollector({
      filter: () => true,
      idle: (1000 * 60) * 2,
      componentType: ComponentType.Button
    })
      .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

        const { customId, user } = int;

        if (customId === "join") return await this.join(int);
        if (customId === "leave") return await this.leave(int);

        if (customId === "start") {
          if (user.id !== this.authorId)
            return await int.reply({
              content: t("blackjack.author", {
                e,
                locale: this.locale,
                author: this.author
              }),
              ephemeral: true
            });

          this.collector?.stop();

          if (this.players.size === 1)
            return await this.autoJoin(int);

          await int.update({ components: [] }).catch(() => { });
          return await this.start();
        }

        if (customId === "cancel")
          this.collector?.stop("cancel");

      })
      .on("end", async (_, reason: CollectorEnding | "cancel"): Promise<any> => {
        this.collector = undefined;
        if (reason === "user") return;

        if (["time", "limit", "idle"].includes(reason)) {
          await this.delete();
          await this.message?.delete().catch(() => { });
          return await this.reply({
            content: t("blackjack.time_ended", { e, locale: this.locale })
          });
        }

        if (["channelDelete", "messageDelete", "guildDelete"].includes(reason))
          return await this.delete();

        if (reason === "cancel") {
          await this.delete();
          await this.message?.delete().catch(() => { });
          return await this.reply({
            content: t("blackjack.cancelled", { e, locale: this.locale })
          });
        }
      });
  }

  async autoJoin(interaction: ButtonInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;

    if (this.value <= 0) {
      this.players.set(user.id, user);
      await interaction.update({ components: [] }).catch(() => { });
      return await this.start();
    }

    const balance = (await Database.getUser(user.id))?.Balance || 0;
    if (this.value > balance)
      return await interaction.reply({
        content: t("pay.balance_not_enough", { e, locale }),
        ephemeral: true
      });

    await Database.editBalance(
      user.id,
      {
        createdAt: new Date(),
        keywordTranslate: "blackjack.transactions.loss",
        method: "sub",
        mode: "blackjack",
        type: "loss",
        value: this.value
      }
    );

    this.players.set(user.id, user);
    await interaction.update({ components: [] }).catch(() => { });
    return await this.start();
  }

  async join(interaction: ButtonInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;
    if (this.players.has(user.id))
      return await interaction.reply({
        content: t("blackjack.you_already_in", { e, locale }),
        ephemeral: true
      });

    if (this.players.size >= this.maxPlayers)
      return await interaction.reply({
        content: t("blackjack.max_users", { e, locale, max: this.maxPlayers }),
        ephemeral: true
      });

    if (this.value > 0) {
      await interaction.deferReply({ ephemeral: true });

      const balance = (await Database.getUser(user.id))?.Balance || 0;

      if (this.value > balance)
        return await interaction.editReply({
          content: t("pay.balance_not_enough", { e, locale })
        });

      await Database.editBalance(
        user.id,
        {
          createdAt: new Date(),
          keywordTranslate: "blackjack.transactions.loss",
          method: "sub",
          mode: "blackjack",
          type: "loss",
          value: this.value
        }
      );
    }

    this.players.set(user.id, user);
    this.refreshInitialEmbed();
    await this.save();
    const payload = {
      content: t("blackjack.joinned", { e, locale, card: deck.random()!.emoji }),
      ephemeral: true
    };
    return interaction.deferred
      ? await interaction.editReply(payload)
      : await interaction.reply(payload);
  }

  async leave(interaction: ButtonInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;

    if (!this.players.has(user.id))
      return await interaction.reply({
        content: t("blackjack.you_already_out", { e, locale }),
        ephemeral: true
      });

    if (this.value > 0) {
      await interaction.deferReply({ ephemeral }).catch(() => { });
      await Database.editBalance(
        user.id,
        {
          createdAt: new Date(),
          keywordTranslate: "blackjack.transactions.refund",
          method: "add",
          mode: "blackjack",
          type: "system",
          value: this.value
        }
      );
    }

    this.players.delete(user.id);
    this.refreshInitialEmbed();
    await this.save();
    const payload = {
      content: t("blackjack.exited", { e, locale }),
      ephemeral: true
    };
    return interaction.deferred
      ? await interaction.editReply(payload)
      : await interaction.reply(payload);
  }

  refreshInitialEmbed() {

    if (this.controller.refreshingInitialEmbed || this.started) return;
    this.controller.refreshingInitialEmbed = true;

    setTimeout(async () => {
      if (this.started) return;

      const payload = {
        embeds: [this.embed],
        components: initialButtons(this.locale, this.players.size, this.maxPlayers)
      };

      this.message = this.message
        ? await this.message.edit(payload).catch(() => undefined)
        : await this.reply(payload);

      if (!this.message)
        this.message = await this.reply(payload);

      if (!this.message) return await this.failed();

      this.controller.refreshingInitialEmbed = false;

    }, 2000);

  }

  getUserPoint(userId: string): number {
    return this.points[userId] || 0;
  }

  async makeNewDeck() {

    const decks: typeof e.cards[] = [];

    for (let i = 0; i < this.decksAmount; i++)
      decks.push(deck);

    this.deck = decks.flat().shuffle();
    await this.save();
    return this.deck;
  }

  async start(restored?: boolean) {
    this.started = true;
    await this.save();

    const msg = await this.reply({
      content: t(
        restored
          ? "blackjack.restoring"
          : "blackjack.loading",
        { e, locale: this.locale })
    });

    if (!msg) return await this.failed();
    if (!this.deck.length) await this.makeNewDeck();

    for await (const userId of this.players.keys()) {
      const cards = this.playerCards.get(userId) || [];
      if (!cards.length) await this.setNewCard(userId);
    }

    await sleep(2500);
    await msg.delete()?.catch(() => { });
    return await this.newTurn();
  }

  async setNewCard(userId: string) {
    const card = this.deck.splice(0, 1)[0];
    const cards = [
      this.playerCards.get(userId) || [],
      card
    ]
      .filter(Boolean)
      .flat();

    this.points[userId] = (this.points[userId] || 0) + card.value;
    this.playerCards.set(userId, cards);
    await this.save();
    return;
  }

  async editOrSendMessage(): Promise<Message | void> {

    this.controller.refreshing = true;

    const payload = {
      content: undefined,
      embeds: [this.embed],
      components: this.playNow ? playButtons(this.locale, false) : []
    };

    if (this.controller.count <= 3) {
      if (this.message)
        return await this.message.edit(payload)
          .then(msg => {
            this.controller.refreshing = false;
            this.lastMessageId = msg.id;
            return msg;
          })
          .catch(async () => {
            const msg = await this.reply.bind(this)(payload);
            this.controller.refreshing = false;
            if (msg) {
              this.lastMessageId = msg.id;
              this.message = msg;
              return msg;
            }
          });
      this.message = await this.reply(payload);
      this.controller.refreshing = false;
      if (this.message) this.lastMessageId = this.message.id;
      return this.message;
    }

    await this.message?.delete().catch(() => { });
    this.message = await this.reply(payload);
    if (this.message) this.lastMessageId = this.message.id;
    this.controller.refreshing = false;
    this.controller.count = 0;
    return this.message;
  }

  async finish() {

    const winners = new Set<string>();
    let firstPoints = 0;

    const under21 = new Collection<string, number>();
    const over21 = new Collection<string, number>();

    for (const [userId, points] of Object.entries(this.points))
      points > 21 ? over21.set(userId, points) : under21.set(userId, points);

    const under21Sorted = under21.sort((a, b) => b - a);
    const over21Sorted = over21.sort((a, b) => b - a);

    firstPoints = under21Sorted.first() || 0;
    const data = new Map<string, number>();

    for (const [userId, points] of [
      Array.from(under21Sorted.entries()),
      Array.from(over21Sorted.entries())
    ].flat()
    ) {
      if (firstPoints === points) winners.add(userId);
      data.set(userId, points)
    }

    let i = 0;
    const description = Array.from(data.entries())
      .map(([userId, points]) => {
        const playerCards = this.playerCards.get(userId) || [];
        let cards = playerCards.map(card => card.emoji).join("");
        if (cards.length) cards = ` - ${cards}`;

        i++;
        let index = 0;

        if (winners.has(userId)) {
          index = 0;
          i--;
        }
        else if (points > 21) {
          index = 3;
          i--;
        }
        else index = i++;

        return `${this.emoji(index)} <@${userId}> - ${points}/21${cards}`;
      })
      .join("\n")
      .limit("EmbedDescription");

    await this.delete(true);
    this.controller.timeToRoundEnd = "";
    this.collector = undefined;
    this.playNow = undefined;
    this.playingNowId = undefined;
    this.started = false;

    const embed = this.embed;
    embed.description = description;

    if (this.value > 0) {

      const users = Array.from(winners);
      const prize = Number(
        ((this.value * this.players.size) / users.length)
          .toFixed(0)
      );

      embed.fields = (prize > 0 && users.length)
        ? [{
          name: t("crash.embed.fields.0.name", { e, locale: this.locale }),
          value: t("blackjack.win", { e, locale: this.locale, users: users.map(id => `<@${id}>`).join(", "), value: prize.currency() })
        }]
        : [];

      if (prize > 0)
        for await (const id of winners)
          if (id !== client.user!.id)
            await Database.editBalance(
              id,
              {
                createdAt: new Date(),
                keywordTranslate: "blackjack.transactions.gain",
                method: "add",
                mode: "blackjack",
                type: "gain",
                value: prize
              }
            );

    } else embed.fields = [];

    return await this.reply({ embeds: [embed] });
  }

  async newTurn(user?: User) {

    const player = user || await this.whoWillPlayNow();
    if (!player?.id) return await this.finish();

    this.playNow = player;
    this.playingNowId = player.id;
    await this.save();

    this.controller.timeToRoundEnd = time(new Date(Date.now() + (1000 * 60) * 2), "R");
    await this.editOrSendMessage();
    return await this.playCollector();
  }

  async dealer(skipSleep?: boolean): Promise<any> {

    if (!skipSleep) await sleep(2000);

    const dealerId = client.user!.id;
    if (!this.message) return await this.failed();
    await this.setNewCard(dealerId);
    const embed = this.embed;
    const points = this.getUserPoint(dealerId);

    if (points >= 17) {
      this.standed.add(dealerId);
      await this.save();

      this.clearTurn();
      await this.editOrSendMessage();

      if (points === 21) {

        if (this.messageDealerReaction)
          this.messageDealerReaction.edit({
            content: e.Animated.SaphireDance
          }).catch(async () => await this.channel?.send(e.Animated.SaphireDance).catch(() => { }));
        else await this.channel?.send(e.Animated.SaphireDance).catch(() => { });

      } else if (this.messageDealerReaction && this.dealerReaction) {
        this.messageDealerReaction.edit({
          content: points <= 21 ? e.Animated.SaphireDance : e.Animated.SaphireCry
        }).catch(() => { });
      }

      await sleep(2000);
      return await this.newTurn();
    }

    await this.message.edit({
      embeds: [embed],
      components: playButtons(this.locale, false)
    }).catch(() => { });

    if (points >= 15 && this.dealerReaction) {
      this.messageDealerReaction = await this.channel?.send({ content: e.Animated.SaphireQuestion }).catch(() => undefined);
      await sleep(2000);
    }

    return setTimeout(async () => await this.dealer(true), 2000);
  }

  clearTurn() {
    this.controller.timeToRoundEnd = "";
    this.collector = undefined;
    this.playNow = undefined;
    this.playingNowId = undefined;
  }

  async playCollector(): Promise<any> {
    if (!this.message) return await this.failed();

    if (this.playingNowId === client.user?.id)
      return await this.dealer();

    return this.collector = this.message.createMessageComponentCollector({
      filter: int => int.user.id === this.playingNowId,
      time: (1000 * 60) * 2,
      componentType: ComponentType.Button
    })
      .on("collect", async (int): Promise<any> => {

        const customId = int.customId as "hit" | "stand";

        if (customId === "hit")
          return await this.hit(int);

        if (customId === "stand") {
          this.standed.add(int.user.id);
          await int.update({
            embeds: [this.embed],
            components: playButtons(this.locale, true)
          }).catch(() => { });
          return this.collector?.stop();
        }

      })
      .on("end", async (_, reason: CollectorEnding | "cancel" | "refresh") => {

        if (reason === "refresh") return;

        this.clearTurn();

        if (reason === "cancel") return;

        if (reason === "user") {
          await this.save();
          await sleep(2000);
          return await this.newTurn();
        }

        if (["idle", "limit", "time"].includes(reason))
          return await this.newTurn();

        if (["channelDelete", "guildDelete", "messageDelete"].includes(reason))
          return await this.delete();
      });
  }

  async hit(int: ButtonInteraction) {
    const { user } = int;

    await this.setNewCard(user.id);

    const embed = this.embed;

    if (this.points[user.id] > 21) {
      this.standed.add(user.id);
      await int.update({
        embeds: [embed], components: playButtons(this.locale, true)
      }).catch(() => { });
      return this.collector?.stop();
    }

    await this.save();
    return await int.update({
      embeds: [embed],
      components: playButtons(this.locale, false)
    }).catch(() => { });
  }

  async whoWillPlayNow(): Promise<User | undefined> {

    const user = this.players.at(this.controller.indexToWhoWillPlayNow);
    if (!user) return;

    if (this.getUserPoint(user.id) > 21 || this.standed.has(user.id)) {
      this.controller.indexToWhoWillPlayNow++;
      return await this.whoWillPlayNow();
    }

    this.controller.indexToWhoWillPlayNow++;
    await this.save();
    return user;
  }

  async reply(payload: { content?: string | null, embeds?: APIEmbed[], components?: any[], fetchReply?: boolean }): Promise<Message | void> {

    if (this.interactionOrMessage instanceof ChatInputCommandInteraction)
      if (this.interactionOrMessage.deferred || this.interactionOrMessage.replied)
        return await this.interactionOrMessage.followUp(payload as any)
          .catch(() => undefined);

    if (this.interactionOrMessage)
      return await this.interactionOrMessage.reply(payload as any)
        .catch(() => undefined);

    if (this.channel)
      return await this.channel.send(payload as any)
        .catch(() => undefined);

    return;
  }

  async delete(finish?: boolean) {
    if (!finish) this.refund();
    ChannelsInGame.delete(this.channelId!);
    if (this.messageCollector) this.messageCollector.stop();
    if (this.message) this.message.delete().catch(() => { });
    if (this.collector) this.collector?.stop();
    if (this.pathname)
      await Database.Games.delete(this.pathname);
  }

  async refund() {
    if (this.value <= 0) return;

    const users = this.players.clone();
    users.delete(client.user!.id);

    for await (const user of this.players.values())
      await Database.editBalance(
        user.id,
        {
          createdAt: new Date(),
          keywordTranslate: "blackjack.transactions.refund",
          method: "add",
          mode: "blackjack",
          type: "system",
          value: this.value
        }
      );
  }

  async corruptedInformation() {
    await this.delete();
    return await this.reply({
      content: t("blackjack.corrupted", { e, locale: this.locale })
    });
  }

  emoji(i: number) {
    return {
      0: "🥇",
      1: "🥈",
      2: "🥉"
    }[i] || "🔹";
  }

}