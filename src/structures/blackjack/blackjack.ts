import { ChatInputCommandInteraction, Collection, Guild, User, GuildTextBasedChannel, LocaleString, Message, APIEmbed, Colors, ButtonInteraction, InteractionCollector, ComponentType, time } from "discord.js";
import { ChannelsInGame, KeyOfLanguages } from "../../util/constants";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import { BlackjackData, CollectorEnding } from "../../@types/commands";
import Database from "../../database";
import { initialButtons, playButtons } from "./constants";
const deck = e.cards;
type card = {
  value: number,
  emoji: string
};
type InteractionOrMessage = ChatInputCommandInteraction<"cached"> | Message<true> | undefined;

export default class Blackjack {

  players = new Collection<string, User>();
  playerCards = new Collection<string, { value: number, emoji: string }[]>();
  points: Record<string, number> = {};
  standed = new Set<string>();
  giveup = new Set<string>();
  deck = [] as card[];
  decksAmount: number = 0;
  defaultDecksAmount = 2;
  maxPlayers = 20;

  controller = {
    timeToRoundEnd: "",
    count: 0,
    refreshingInitialEmbed: false,
    refreshingInitialEmbedTimeout: 0,
    indexToWhoWillPlayNow: 0
  } as {
    timeToRoundEnd: string
    count: number
    indexToWhoWillPlayNow: number
    refreshingInitialEmbed: boolean
    refreshingInitialEmbedTimeout: NodeJS.Timeout | 0
  };

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
      card1: deck.random().emoji,
      card2: deck.random().emoji
    });
  }

  get playersDescription() {
    return this.players
      .map(user => {
        const playerCards = this.playerCards.get(user.id) || [];
        let cardsToString = "";

        for (const card of playerCards)
          cardsToString += card.emoji;

        if (cardsToString.length)
          cardsToString = ` - ${cardsToString}`;

        return `${deck.random().emoji} ${user} - ${this.getUserPoint(user.id)}/21${cardsToString}`;
      })
      .join("\n")
      .limit("EmbedDescription")
      || t("blackjack.awaiting_players", { e, locale: this.locale });
  }

  get embed(): APIEmbed {
    return {
      color: Colors.Blue,
      title: this.title,
      description: this.playersDescription,
      fields: [
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
      ]
    };
  }

  async load() {

    this._locale = this.locale;

    if (this.options.decksAmount)
      this.decksAmount = this.options.decksAmount;

    if (!this.decksAmount && this.interactionOrMessage instanceof ChatInputCommandInteraction)
      this.decksAmount = this.interactionOrMessage.options.getInteger("decks") || this.defaultDecksAmount;

    if (!this.decksAmount)
      this.decksAmount = this.defaultDecksAmount;

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

    if (this.options.eliminated) this.standed = new Set(this.options.eliminated);
    if (this.options.giveup) this.giveup = new Set(this.options.giveup);

    if (this.options.playerCards?.length)
      for (const [userId, cards] of Object.entries(this.options.playerCards))
        if (typeof userId === "string" && Array.isArray(cards)) {
          this.points[userId] = 0;
          for (const card of cards) this.points[userId] += card.value;
          this.playerCards.set(userId, cards);
        }

    if (this.options.playingNowId) {
      this.playNow = await client.users.fetch(this.options.playingNowId).catch(() => undefined);
      if (!this.playNow) return await this.corruptedInformation();
    }

    ChannelsInGame.add(this.channelId);
    this.pathname = `Blackjack.${this.guildId}.${this.channelId}`;

    if (this.players.size) {
      if (this.playingNowId && this.playNow)
        return await this.newTurn(this.playNow);
      return await this.start();
    }
    return await this.init();
  }

  async save() {
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
        giveup: Array.from(this.giveup),
        playerCards: this.playerCards.reduce((_, cards, userId) => ({ [userId]: cards }), {})
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

        const { userLocale: locale, customId, user } = int;

        if (customId === "join") {

          if (this.players.has(user.id))
            return await int.reply({
              content: t("blackjack.you_already_in", { e, locale }),
              ephemeral: true
            });

          if (this.players.size >= this.maxPlayers)
            return await int.reply({
              content: t("blackjack.max_users", { e, locale, max: this.maxPlayers }),
              ephemeral: true
            });

          this.players.set(user.id, user);
          this.refreshInitialEmbed();
          await int.reply({
            content: t("blackjack.joinned", { e, locale, card: deck.random().emoji }),
            ephemeral: true
          });
          return await this.save();
        }

        if (customId === "leave") {

          if (!this.players.has(user.id))
            return await int.reply({
              content: t("blackjack.you_already_out", { e, locale }),
              ephemeral: true
            });

          this.players.delete(user.id);
          this.refreshInitialEmbed();
          await int.reply({
            content: t("blackjack.exited", { e, locale }),
            ephemeral: true
          });
          return await this.save();
        }

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

          if (!this.players.size)
            this.players.set(user.id, user);

          await int.update({ components: [] }).catch(() => { });
          return await this.start();
        }

        if (customId === "cancel") {
          this.collector?.stop("cancel");
        }

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

  async start() {
    this.started = true;
    await this.save();

    const msg = await this.reply({
      content: t("blackjack.loading", { e, locale: this.locale })
    });

    if (!msg) return await this.failed();

    for (let i = 0; i < this.decksAmount; i++)
      this.deck.push(...deck);

    this.deck = this.deck.shuffle();

    for await (const userId of this.players.keys())
      this.setNewCard(userId);

    await sleep(2500);
    await msg.delete()?.catch(() => { });
    return await this.newTurn();
  }

  setNewCard(userId: string) {
    const card = this.deck.splice(0, 1)[0];
    const cards = [
      this.playerCards.get(userId) || [],
      card
    ]
      .filter(Boolean)
      .flat();

    this.points[userId] = (this.points[userId] || 0) + card.value;
    this.playerCards.set(userId, cards);
    return;
  }

  async editOrSendMessage(): Promise<Message | void> {

    const payload = {
      content: undefined,
      embeds: [this.embed],
      components: this.playNow ? playButtons(this.locale, false) : []
    };

    if (this.controller.count <= 3) {
      if (this.message)
        return await this.message.edit(payload)
          .catch(async () => {
            this.message = await this.reply.bind(this)(payload);
            return this.message;
          });
      this.message = await this.reply(payload);
      return this.message;
    }

    await this.message?.delete().catch(() => { });
    this.message = await this.reply(payload);
    return this.message;
  }

  async finish() {

    const data = Object.entries(this.points)
      .sort((a, b) => {
        if (a[1] > 21) return 1;
        return b[1] - a[1];
      });

    const players = this.players.clone();
    this.players.clear();

    const over21 = new Map<string, User>();

    for (const [userId] of data) {
      const user = players.get(userId);
      if (user) {
        if (this.points[user.id] > 21) {
          over21.set(user.id, user);
          continue;
        }
        this.players.set(user.id, user);
      }
    }

    for (const user of over21.values())
      this.players.set(user.id, user);

    await this.delete();
    this.controller.timeToRoundEnd = "";
    this.collector = undefined;
    this.playNow = undefined;
    this.playingNowId = undefined;
    this.started = false;

    const embed = this.embed;
    embed.fields = [];
    return await this.reply({ embeds: [embed] });
  }

  async newTurn(user?: User) {

    const player = user || this.whoWillPlayNow();
    if (!player?.id) return await this.finish();

    this.playNow = player;
    this.playingNowId = player.id;
    await this.save();

    this.controller.timeToRoundEnd = time(new Date(Date.now() + (1000 * 60) * 2), "R");
    await this.editOrSendMessage();
    return await this.playCollector();
  }

  async playCollector(): Promise<any> {
    if (!this.message) return await this.failed();

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
      .on("end", async (_, reason: CollectorEnding | "cancel") => {
        this.controller.timeToRoundEnd = "";
        this.collector = undefined;
        this.playNow = undefined;
        this.playingNowId = undefined;

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

    this.setNewCard(user.id);

    const embed = this.embed;

    if (this.points[user.id] > 21) {
      this.standed.add(user.id);
      await int.update({
        embeds: [embed], components: playButtons(this.locale, true)
      }).catch(() => { });
      return this.collector?.stop();
    }

    return await int.update({
      embeds: [embed],
      components: playButtons(this.locale, false)
    }).catch(() => { });
  }

  whoWillPlayNow(): User | undefined {

    const user = this.players.at(this.controller.indexToWhoWillPlayNow);
    if (!user) return;

    if (this.getUserPoint(user.id) > 21 || this.standed.has(user.id)) {
      this.controller.indexToWhoWillPlayNow++;
      return this.whoWillPlayNow();
    }

    this.controller.indexToWhoWillPlayNow++;
    this.save();
    return user;
  }

  async reply(payload: { content?: string | null, embeds?: APIEmbed[], components?: any[], fetchReply?: boolean }): Promise<Message | void> {

    if (this.interactionOrMessage instanceof ChatInputCommandInteraction)
      if (this.interactionOrMessage.deferred || this.interactionOrMessage.replied)
        return await this.interactionOrMessage.followUp(payload as any);

    if (this.interactionOrMessage)
      return await this.interactionOrMessage.reply(payload as any);

    if (this.channel)
      return await this.channel.send(payload as any);

    return;
  }

  async delete() {
    ChannelsInGame.delete(this.channelId!);
    if (this.message) this.message.delete().catch(() => { });
    if (this.collector) this.collector?.stop();
    if (this.pathname)
      await Database.Games.delete(this.pathname);
  }

  async corruptedInformation() {
    await this.delete();
    return await this.reply({
      content: t("blackjack.corrupted", { e, locale: this.locale })
    });
  }
}