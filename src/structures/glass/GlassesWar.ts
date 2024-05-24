import {
  APIEmbed,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  Guild,
  LocaleString,
  Message,
  MessageCollector,
  PermissionsBitField,
  TextChannel,
  User,
  time
} from "discord.js";
import { GlassData } from "../../@types/commands";
import client from "../../saphire";
import { t } from "../../translator";
import { ChannelsInGame, KeyOfLanguages } from "../../util/constants";
import { e } from "../../util/json";
import Database from "../../database";

export const GlassGames = new Map<string, GlassesWar>();
type Options = {
  guild?: Guild | null
  channel?: TextChannel | null
  author?: User | null,
  players?: string[]
  lives?: Record<string, number>
};

const nums = {
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣",
  9: "9️⃣",
  10: "🔟",
};

export default class GlassesWar {

  players = new Collection<string, User>();
  lives = {} as Record<string, number>;
  glasses_taken = {} as Record<string, number>;
  glasses_given = {} as Record<string, number>;
  maxOfPlayers = 20;
  minOfPlayers = 3;
  defaultAwaitingTime = 1000 * 15;
  emojiAlive = e.glassAlive;
  emojiDead = e.glassBroken;
  refreshingInitialEmbed = false;
  refreshingInitialTimeout = 0 as NodeJS.Timeout | 0;
  turns = {} as Record<number, string>;
  started = false;
  giveUpUsers = new Set<string>();

  controller = {
    awaitingToMentionAMemberToAttack: false,
    awaitingToMentionAMemberToGiveGlass: false,
    indexToWhoWillPlayNow: 0,
    timeoutToMentionAnUser: 0,
    timeoutGeneral: 0,
    timeoutToStartTheGame: 0,
    collector: undefined,
    count: 0,
    refreshing: false,
    messageVariableToComunication: undefined
  } as {
    awaitingToMentionAMemberToAttack: boolean
    awaitingToMentionAMemberToGiveGlass: boolean
    indexToWhoWillPlayNow: number
    timeoutToMentionAnUser: NodeJS.Timeout | 0
    timeoutGeneral: NodeJS.Timeout | 0
    timeoutToStartTheGame: NodeJS.Timeout | 0
    collector: MessageCollector | undefined
    count: number
    refreshing: boolean
    messageVariableToComunication: Message | undefined
  };

  declare playingNow: User | undefined;
  declare userUnderAttack: User | undefined;
  declare data: GlassData;
  declare author: User | undefined;
  declare guild: Guild | undefined;
  declare channel: TextChannel | undefined;
  declare message: Message | undefined;
  declare _locale: LocaleString;
  declare interactionOrMessage: Message | ChatInputCommandInteraction | undefined;
  declare pathname: string;

  constructor(data: GlassData, interactionOrMessage?: Message | ChatInputCommandInteraction | undefined, options?: Options) {
    this.data = data;
    this.lives = data.lives || {};
    this.interactionOrMessage = interactionOrMessage;
    this.data.players = options?.players || data.players || [];
    this.data.lives = this.lives;

    if (data.giveUpUsers?.length)
      this.giveUpUsers = new Set(data.giveUpUsers);
    else {
      data.giveUpUsers = [];
      this.data = data;
    }

    if (options?.author) {
      this.author = options.author;
      this.data.authorId = options.author.id;
    }

    if (options?.guild) {
      this.guild = options.guild;
      this.data.guildId = options.guild.id;
    }

    if (options?.channel) {
      this.channel = options.channel;
      this.data.channelId = options.channel.id;
    }

    this._locale = this.locale;
    this.started = this.data.started || false;
    this.load();
  }

  get number() {
    return Math.floor(Math.random() * 10) + 1;
  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (!this.interactionOrMessage) {
      this._locale = client.defaultLocale as LocaleString;
      return this._locale;
    }

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

    this._locale = this.interactionOrMessage.guild?.preferredLocale
      || this.interactionOrMessage.userLocale
      || client.defaultLocale;

    return this._locale;
  }

  get gameEmbed(): APIEmbed {
    return this.message?.embeds?.[0]?.toJSON()
      || {
      color: Colors.Blue,
      title: t("glass.embed.title", this.locale)
    };
  }

  get initialComponents() {
    return this.started
      ? [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: `${t("keyword_cancel", this.locale)} ${this.giveUpUsers.size}/${Number((this.players.size / 2).toFixed(0)) + 1}`,
              emoji: "🏳️",
              custom_id: JSON.stringify({ c: "glass", src: "giveup" }),
              style: ButtonStyle.Danger,
              disabled: this.players.size <= 1
            }
          ]
        }
      ]
      : [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("glass.components.initial.join", {
                locale: this.locale,
                players: this.players.size >= 20 ? 20 : this.players.size,
                max: this.maxOfPlayers
              }),
              emoji: "🏃‍♂️".emoji(),
              custom_id: JSON.stringify({ c: "glass", src: "join" }),
              style: ButtonStyle.Primary,
              disabled: this.players.size >= this.maxOfPlayers
            },
            {
              type: 2,
              label: t("glass.components.initial.leave", this.locale),
              emoji: e.SaphireDesmaiada.emoji(),
              custom_id: JSON.stringify({ c: "glass", src: "leave" }),
              style: ButtonStyle.Danger
            },
            {
              type: 2,
              label: t("glass.components.initial.start", {
                locale: this.locale,
                players: this.players.size <= 3 ? this.players.size : 3,
                min: this.minOfPlayers
              }),
              emoji: e.glassAlive.emoji(),
              custom_id: JSON.stringify({ c: "glass", src: "start" }),
              style: ButtonStyle.Success,
              disabled: this.players.size < this.minOfPlayers
            },
            {
              type: 2,
              label: t("glass.components.initial.cancel", this.locale),
              emoji: e.DenyX.emoji(),
              custom_id: JSON.stringify({ c: "glass", src: "cancel" }),
              style: ButtonStyle.Secondary
            }
          ]
        }
      ];
  }

  async load() {

    this.guild = this.guild || client.guilds.cache.get(this.data.guildId!) || await client.guilds.fetch(this.data.guildId!).catch(() => undefined);
    if (!this.guild) return await this.delete();

    this.channel = this.channel || this.guild.channels.cache.get(this.data.channelId!) as TextChannel || await this.guild.channels.fetch(this.data.channelId).catch(() => undefined) as TextChannel | undefined;
    if (!this.channel || ChannelsInGame.has(this.channel.id)) return await this.delete();

    this.author = this.author || client.users.cache.get(this.data.authorId!) || await client.users.fetch(this.data.authorId!).catch(() => undefined);
    if (!this.author) return await this.error("Game's creator not found.");

    const perms = this.channel.permissionsFor(this.guild.members.me!, true);
    if (!perms.has(PermissionsBitField.Flags.SendMessages))
      return await this.delete();

    this.pathname = `Glasses.${this.guild.id}.${this.channel.id}`;
    ChannelsInGame.add(this.channel.id);
    GlassGames.set(this.channel.id, this);

    await this.save();
    if (this.data.players?.length) {

      await Promise.all(
        this.data.players.map(userId => client.users.fetch(userId).catch(() => null))
      )
        .then(users => {
          for (const user of users)
            if (user)
              this.players.set(user.id, user);
        });

      if (this.data.playingNowId)
        this.playingNow = await client.users.fetch(this.data.playingNowId);

      if (this.data.userUnderAttackId)
        this.userUnderAttack = await client.users.fetch(this.data.userUnderAttackId);

      if (
        (this.data.playingNowId && !this.playingNow)
        || (this.data.userUnderAttackId && !this.userUnderAttack)
      )
        return await this.error("Game's data is unknown");
    }

    this.messageCollectorControl();

    if (this.data.lastMessageId) {
      const msg = await this.channel.messages.fetch(this.data.lastMessageId);
      if (msg) await msg?.delete().catch(() => { });
      this.data.lastMessageId = undefined;
    }

    if (this.started) return await this.start();
    return await this.sendMessageAndAwaitMembers();
  }

  messageCollectorControl() {
    if (!this.channel) return;

    this.controller.collector = this.channel.createMessageCollector({
      filter: () => true
    })
      .on("collect", async message => {

        if (this.controller.awaitingToMentionAMemberToAttack)
          await this.messageFromPlayer(message);

        if (this.controller.awaitingToMentionAMemberToGiveGlass)
          await this.messageMentionGiveGlass(message);

        if (
          this.controller.refreshing
          || !this.message
          || !this.channel
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

          const content = this.message.content || undefined;
          const embed = this.gameEmbed;
          embed.description = this.playersDescription();

          if (content?.length || embed) {
            await this.deleteMessage();

            this.message = await this.channel.send({
              content,
              embeds: [embed],
              components: this.initialComponents
            })
              .then(msg => {
                this.data.lastMessageId = msg.id;
                return msg;
              })
              .catch(this.error.bind(this));
          }

          this.controller.refreshing = false;
          this.controller.count = 0;
          return;
        }

        return;
      })
      .on("end", () => {
        this.controller.collector = undefined;
        this.controller.count = 0;
        this.controller.refreshing = false;
      });
    return;
  }

  async giveup(interaction: ButtonInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;

    if (!this.players.has(user.id))
      return await interaction.reply({
        content: t("glass.dont_click_here", { e, locale }),
        ephemeral: true
      });

    this.giveUpUsers.has(user.id)
      ? this.giveUpUsers.delete(user.id)
      : this.giveUpUsers.add(user.id);

    this.data.giveUpUsers = Array.from(this.giveUpUsers);

    if (this.giveUpUsers.size >= (this.players.size / 2) + 1) {
      await this.delete();
      return await this.send({
        content: t("glass.cancelled", { e, locale: this.locale })
      });
    }

    await this.save();

    return await interaction.update({
      components: this.initialComponents
    }).catch(() => { });
  }

  async deleteMessage() {
    if (!this.message) return;
    await this.message.delete().catch(() => { });
    this.message = undefined;
    this.data.lastMessageId = undefined;
    return;
  }

  async sendMessageAndAwaitMembers() {

    if (!this.channel) return await this.error("Missing channel");

    const payload = {
      embeds: [{
        color: Colors.Blue,
        title: t("glass.embed.title", { e, locale: this.locale }),
        description: this.playersDescription(),
        fields: [
          {
            name: t("glass.embed.fields.0.name", { e, locale: this.locale }),
            value: t("glass.embed.fields.0.value", { e, locale: this.locale })
          }
        ]
      }],
      components: this.initialComponents,
      fetchReply: true
    };

    this.message = this.interactionOrMessage
      ? await this.interactionOrMessage.reply(payload as any).catch(this.error.bind(this))
      : await this.channel.send(payload).catch(this.error.bind(this));

    if (!this.message) return;

    this.data.lastMessageId = this.message.id;
    this.controller.timeoutToStartTheGame = setTimeout(async () => {
      await this.delete();
      return await this.send({ content: t("glass.cancelled", { e, locale: this.locale }) });
    }, (1000 * 60) * 2);
  }

  async error(err: Error | string): Promise<undefined> {
    await this.delete();
    if (this.channel)
      await this.channel.send({
        content: `${t("glass.error", { e, err, locale: this.locale })}`.limit("MessageContent")
      })
        .catch(() => { });
    return undefined;
  }

  playersDescription() {
    return Array.from(
      this.players.values()
    )
      .map((user, i) => `${i + 1}. ${user.displayName} ${this.emojis(this.lives[user.id] || 0)}`)
      .join("\n")
      .limit("EmbedDescription")
      || t("glass.awaiting_players", { e, locale: this.locale });
  }

  emojis(num: number): string {
    let lives = "";

    for (let i = 1; i <= 3; i++)
      lives += i <= num ? this.emojiAlive : this.emojiDead;

    return lives;
  }

  async join(interaction: ButtonInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;

    if (this.players.has(user.id))
      return await interaction.reply({
        content: t("glass.you_already_joined", { e, locale }),
        ephemeral: true
      });

    if (this.players.size >= this.maxOfPlayers)
      return await interaction.reply({
        content: t("glass.over_limit_players", { e, locale: interaction.userLocale }),
        ephemeral: true
      });

    await this.addParticipant(user);
    this.refreshInitalEmbed();
    return await interaction.reply({
      content: t("glass.you_join", { e, locale }),
      ephemeral: true
    });
  }

  async leave(interaction: ButtonInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;

    if (!this.players.has(user.id))
      return await interaction.reply({
        content: t("glass.you_already_out", { e, locale }),
        ephemeral: true
      });

    await this.removeParticipant(user);
    this.refreshInitalEmbed();
    return await interaction.reply({
      content: t("glass.you_out", { e, locale }),
      ephemeral: true
    });
  }

  async addParticipant(user: User) {
    this.players.set(user.id, user);
    this.lives[user.id] = 3;
    this.data.players = Array.from(this.players.keys());
    return await this.save();
  }

  async removeParticipant(user: User) {
    this.players.delete(user.id);
    delete this.lives[user.id];
    this.data.players = Array.from(this.players.keys());
    return await this.save();
  }

  async start(interaction?: ButtonInteraction<"cached">) {

    if (interaction && interaction.user.id !== this.data.authorId)
      return await interaction.reply({
        content: t("glass.you_cannot_start", {
          e,
          locale: interaction.userLocale,
          author: this.author
        }),
        ephemeral: true
      });

    if (this.players.size < this.minOfPlayers) {
      if (!interaction) return await this.delete();
      return await interaction.reply({
        content: t("glass.minOfPlayers", { e, locale: interaction.userLocale, minOfPlayers: this.minOfPlayers }),
        ephemeral: true
      });
    }

    this.started = true;
    this.data.started = true;
    clearTimeout(this.refreshingInitialTimeout);
    const embed = this.gameEmbed;
    embed.description = this.playersDescription();
    if (interaction)
      await interaction.update({ embeds: [embed], components: this.initialComponents }).catch(() => { });
    const msg = await this.send({
      content: t("glass.starting", { e, locale: this.locale }),
      components: [], fetchReply: true
    })?.catch(() => { });

    const players = Array.from(this.players.keys());
    for (let i = 0; i < players.length; i++)
      this.turns[i] = players[i];

    await sleep(3000);
    if (msg) await msg.delete()?.catch(() => { });

    clearTimeout(this.controller.timeoutToStartTheGame);
    return await this.newTurn(this.playingNow);
  }

  async cancel(interaction: ButtonInteraction<"cached">) {

    const { user, userLocale: locale } = interaction;

    if (user.id !== this.data.authorId)
      return await interaction.reply({
        content: t("glass.you_cannot_cancel", {
          e,
          locale,
          author: this.author
        }),
        ephemeral: true
      });

    await this.delete();
    return await interaction.message?.delete();
  }

  async delete() {

    if (this.channel?.id) {
      ChannelsInGame.delete(this.channel.id);
      GlassGames.delete(this.channel.id);
    }

    await Database.Games.delete(this.pathname);
    await this.deleteMessage();
    if (this.controller.collector) this.controller.collector?.stop();
    if (this.controller.messageVariableToComunication) await this.controller.messageVariableToComunication.delete().catch(() => { });

    for (const type of ["timeoutToMentionAnUser", "timeoutToStartTheGame", "timeoutGeneral"])
      clearTimeout(this.controller[type as "timeoutToMentionAnUser" | "timeoutToStartTheGame" | "timeoutGeneral"]);
  }

  async save() {
    return await Database.Games.set(this.pathname, this.data);
  }

  async messageFromPlayer(message: Message) {

    if (
      !message.content.length
      || message.author.id !== this.playingNow?.id
    ) return;

    const num = Number(message.content);
    let user: User | undefined;

    if (num > 0 && num <= this.players.size)
      user = this.players.get(this.turns[num - 1]) || message.mentions.users.first();
    else user = message.mentions.users.first();

    if (!user) return;

    if (
      !this.players.has(user.id)
      || user.id === message.author.id
      || !this.lives[user.id]
    )
      return await message.react(e.DenyX).catch(() => { });

    clearTimeout(this.controller.timeoutToMentionAnUser);
    this.controller.awaitingToMentionAMemberToAttack = false;
    this.userUnderAttack = user;
    this.data.userUnderAttackId = user.id;
    await this.save();
    return await this.rollDice(message.author);
  }

  async playerDontAnswer(userId: string) {
    this.controller.awaitingToMentionAMemberToAttack = false;
    this.controller.awaitingToMentionAMemberToGiveGlass = false;
    this.data.playingNowId = undefined;
    this.data.userUnderAttackId = undefined;
    this.removeLive(userId);
    await this.save();

    const payload = {
      content: t("glass.lost_turn", {
        e,
        user: `<@${userId}>`,
        locale: this.locale
      }),
      components: [],
      embeds: []
    };

    const ok = await this.send(payload);
    if (!ok) return;

    await sleep(4000);
    this.refreshEmbedGameMessage();
    return await this.newTurn();
  }

  async send(payload: any): Promise<Message | undefined> {
    if (!this.channel) return await this.error("Missing channel");

    if (this.controller.messageVariableToComunication)
      this.controller.messageVariableToComunication?.delete()?.catch(() => { });

    this.controller.messageVariableToComunication = await this.channel?.send(payload).catch(err => this.error(`Error to display the variable message - ${err}`));
    return this.controller.messageVariableToComunication;
  }

  async winner(user?: User) {

    if (!user)
      return await this.error("No winner found");

    if (!this.channel)
      return await this.error("Missing channel");

    await this.delete();
    await this.refreshEmbedGameMessage(true);

    return await this.channel.send({
      content: t("glass.congrats", {
        e,
        locale: this.locale,
        lives: this.lives[user.id] || 0,
        user,
        players: this.players.size - 1,
        glasses_taken: this.glasses_taken[user.id] || 0,
        glasses_given: this.glasses_given[user.id] || 0
      })
    }).catch(() => { });

  }

  async newTurn(recoveredUser?: User) {

    const user = recoveredUser || this.whoWillPlayNow();

    if (typeof user === "string")
      return await this.winner(this.players.get(user));

    if (!user)
      return await this.error("No user turn found");

    this.playingNow = user;
    this.data.playingNowId = user.id;

    const ok = await this.send({
      content: t("glass.your_turn", {
        e,
        locale: this.locale,
        user,
        time: time(new Date(Date.now() + this.defaultAwaitingTime), "R")
      })
    });
    if (!ok) return;

    this.controller.awaitingToMentionAMemberToAttack = true;
    await this.save();
    return this.timeout("timeoutToMentionAnUser", user.id);
  }

  whoWillPlayNow(): User | undefined | string {

    const winner = Object.entries(this.lives)
      .filter(([_, lives]) => lives > 0)
      .map(([id]) => id);

    if (winner.length === 1)
      return winner[0];

    let i = this.controller.indexToWhoWillPlayNow;
    if (i >= this.players.size) {
      i = 0;
      this.controller.indexToWhoWillPlayNow = 0;
    }

    const userId = this.turns[i];
    const user = this.players.get(userId);
    if (!user) return;

    if (!this.lives[userId]) {
      this.controller.indexToWhoWillPlayNow++;
      return this.whoWillPlayNow();
    }

    this.controller.indexToWhoWillPlayNow++;
    return user;
  }

  async rollDice(user: User) {
    const ok = await this.send({
      content: t("glass.rolldice", {
        e,
        locale: this.locale,
        user: this.playingNow,
        userUnderAttack: this.userUnderAttack,
        time: time(new Date(Date.now() + this.defaultAwaitingTime), "R")
      }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("glass.roll", this.locale),
              emoji: e.dice.emoji(),
              custom_id: JSON.stringify({ c: "glass", src: "dice" }),
              style: ButtonStyle.Success
            }
          ]
        }
      ]
    });
    if (ok) this.timeout("timeoutGeneral", user.id);
  }

  timeout(type: "timeoutGeneral" | "timeoutToMentionAnUser", userId: string) {
    this.controller[type] = setTimeout(async () => await this.playerDontAnswer(userId), this.defaultAwaitingTime);
  }

  async number10(interaction: ButtonInteraction<"cached">) {
    const ok = await this.send({
      content: t("glass.10", {
        e,
        locale: this.locale,
        user: interaction.user,
        userUnderAttack: this.userUnderAttack,
        time: time(new Date(Date.now() + this.defaultAwaitingTime), "R")
      }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("glass.components.number10.give", this.locale),
              custom_id: JSON.stringify({ c: "glass", src: "give" }),
              emoji: this.emojiAlive.emoji(),
              style: ButtonStyle.Success,
              disabled: Object.entries(this.lives)
                .filter(([userId, lives]) => userId !== interaction.user.id && lives === 0)
                .length === 0
            },
            {
              type: 2,
              label: t("glass.components.number10.remove", this.locale),
              custom_id: JSON.stringify({ c: "glass", src: "remove" }),
              emoji: this.emojiDead.emoji(),
              style: ButtonStyle.Danger
            }
          ]
        }
      ]
    });
    if (ok) this.timeout("timeoutGeneral", interaction.user.id);
  }

  async messageMentionGiveGlass(message: Message) {

    if (
      !message.content.length
      || message.author.id !== this.playingNow?.id
    ) return;

    const user = message.mentions.users.first();
    if (!user) return;

    if (
      !this.players.has(user.id)
      || user.id === message.author.id
      || this.lives[user.id]
    )
      return await message.react(e.DenyX).catch(() => { });

    clearTimeout(this.controller.timeoutGeneral);
    this.controller.awaitingToMentionAMemberToGiveGlass = false;
    this.lives[user.id] = (this.lives[user.id] || 0) + 1;
    this.glasses_given[user.id] = (this.glasses_given[user.id] || 0) + 1;

    const ok = await this.send({
      content: t("glass.10_given", {
        e,
        locale: this.locale,
        user: message.author,
        mention: user
      }),
      fetchReply: true,
      components: [],
      embeds: []
    });
    if (!ok) return;

    this.clearPlayerToThisTurn();
    await this.refreshEmbedGameMessage();
    return setTimeout(async () => await this.newTurn(), 4000);
  }

  async give(interaction: ButtonInteraction<"cached">) {

    if (!this.channel) return await this.error("Missing channel");

    if (!this.playingNow) {
      await this.delete();
      return await interaction.update({
        content: t("glass.not_found", { e, locale: this.locale }),
        embeds: [], components: []
      });
    }

    if (interaction.user.id !== this.playingNow?.id)
      return await interaction.reply({
        content: t("glass.dont_click_here", {
          e,
          locale: interaction.userLocale
        }),
        ephemeral: true
      });

    clearTimeout(this.controller.timeoutGeneral);

    const ok = await this.send({
      content: t("glass.choose_an_user", {
        e,
        locale: this.locale,
        user: interaction.user
      }),
      embeds: [{
        color: Colors.Blue,
        title: t("glass.embed.title_outgame", { e, locale: this.locale }),
        description: Object.entries(this.lives)
          .filter(([userId, lives]) => userId !== interaction.user.id && lives === 0)
          .map(([userId]) => `${this.players.get(userId || "")} ${this.emojis(this.lives[userId])}`)
          .join("\n")
          .limit("EmbedDescription")
          || t("glass.no_user", { e, locale: this.locale })
      }]
    });
    if (!ok) return;

    this.controller.awaitingToMentionAMemberToGiveGlass = true;
    this.timeout("timeoutGeneral", interaction.user.id);
    return;
  }

  async remove(interaction: ButtonInteraction<"cached">) {

    if (!this.channel) return await this.error("Missing channel");

    if (!this.playingNow) {
      await this.delete();
      return await interaction.update({
        content: t("glass.not_found", { e, locale: this.locale }),
        embeds: [], components: []
      });
    }

    if (interaction.user.id !== this.playingNow?.id)
      return await interaction.reply({
        content: t("glass.dont_click_here", {
          e,
          locale: interaction.userLocale
        }),
        ephemeral: true
      });

    clearTimeout(this.controller.timeoutGeneral);

    if (!this.userUnderAttack?.id)
      return await this.error("Game's base data is unknown");
    this.removeLive(this.userUnderAttack.id);
    this.glasses_taken[interaction.user.id] = (this.glasses_taken[interaction.user.id] || 0) + 1;

    const ok = await this.send({
      content: t("glass.10_remove", {
        e,
        locale: this.locale,
        user: interaction.user,
        userUnderAttack: this.userUnderAttack
      }),
      fetchReply: true,
      components: [],
      embeds: []
    });
    if (!ok) return;

    this.clearPlayerToThisTurn();
    await this.refreshEmbedGameMessage();
    return setTimeout(async () => await this.newTurn(), 4000);
  }

  async dice(interaction: ButtonInteraction<"cached">) {
    if (!this.channel) return await this.error("Missing channel");

    if (!this.playingNow) {
      await this.delete();
      return await interaction.update({
        content: t("glass.not_found", { e, locale: this.locale }),
        embeds: [], components: []
      });
    }

    if (interaction.user.id !== this.playingNow?.id)
      return await interaction.reply({
        content: t("glass.dont_click_here", {
          e,
          locale: interaction.userLocale
        }),
        ephemeral: true
      });

    clearTimeout(this.controller.timeoutGeneral);
    await interaction.update({
      content: e.dice,
      components: [],
      fetchReply: true
    }).catch(() => { });
    await sleep(2000);

    const number = this.number as keyof typeof nums;
    let payload: any = {};

    if (number === 1) {
      this.removeLive(interaction.user.id);
      payload = {
        content: t("glass.1", { e, locale: this.locale, user: interaction.user })
      };
    }

    if (number === 10)
      return await this.number10(interaction);

    if (number > 1 && number <= 5)
      payload = {
        content: t("glass.lost_your_turn", {
          num: nums[number],
          user: interaction.user,
          locale: this.locale,
          number
        }),
        embeds: [],
        components: []
      };

    if (number > 5 && number <= 9) {
      if (!this.userUnderAttack?.id)
        return await this.error("Game's base data is unknown");
      this.removeLive(this.userUnderAttack.id);
      this.glasses_taken[interaction.user.id] = (this.glasses_taken[interaction.user.id] || 0) + 1;

      payload = {
        content: t("glass.you_attack_the_target", {
          e,
          locale: this.locale,
          num: nums[number],
          number,
          user: interaction.user,
          userUnderAttack: this.userUnderAttack
        })
      };
    }

    payload.embeds = [];
    payload.components = [];

    const ok = await this.send(payload);
    if (!ok) return;

    this.clearPlayerToThisTurn();
    await this.refreshEmbedGameMessage();
    return setTimeout(async () => await this.newTurn(), 4000);
  }

  clearPlayerToThisTurn() {
    this.data.playingNowId = undefined;
    this.data.userUnderAttackId = undefined;
    this.playingNow = undefined;
    this.userUnderAttack = undefined;
  }

  async refreshEmbedGameMessage(finish?: boolean) {
    if (!this.channel) return;

    const embed = this.gameEmbed;
    embed.description = this.playersDescription();
    await this.deleteMessage();
    const payload = { embeds: [embed], components: this.initialComponents };

    if (finish) {
      embed.fields = [];
      return await this.send(payload);
    }

    this.message = await this.channel.send(payload).catch(this.error.bind(this));
    if (this.message) this.data.lastMessageId = this.message.id;
  }

  removeLive(userId: string) {
    if (!this.lives[userId]) return;
    this.lives[userId]--;
  }

  refreshInitalEmbed() {
    if (this.refreshingInitialEmbed || !this.message) return;

    this.refreshingInitialEmbed = true;
    this.refreshingInitialTimeout = setTimeout(async () => {

      if (!this.channel)
        return await this.error("Missing channel");

      const embed = this.gameEmbed;
      embed.description = this.playersDescription();

      const payload = {
        content: undefined,
        embeds: [embed],
        components: this.initialComponents
      };

      if (this.message) {
        await this.message.edit({
          embeds: [embed],
          components: this.initialComponents
        })
          .then(msg => this.data.lastMessageId = msg.id)
          .catch(this.error.bind(this));
        this.refreshingInitialEmbed = false;
        return;
      }

      await this.deleteMessage();
      this.message = await this.channel.send(payload)
        .then(msg => {
          this.data.lastMessageId = msg.id;
          return msg;
        })
        .catch(this.error.bind(this));
      this.refreshingInitialEmbed = false;
    }, 2000);

    return;
  }

}