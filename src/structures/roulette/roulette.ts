import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, ComponentType, Guild, GuildTextBasedChannel, InteractionReplyOptions, InteractionResponse, LocaleString, Message, MessageCollector, MessageFlags, MessagePayload, parseEmoji, User } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";
import { ChannelsInGame, KeyOfLanguages } from "../../util/constants";
import { setTimeout as sleep } from "timers/promises";
import { CollectorReasonEnd } from "../../@types/commands";

export default class RussianRoulette {

  declare interactionOrMessage: Message<true> | ChatInputCommandInteraction<"cached">;
  declare caller: User;
  declare channelId: string;
  declare message: void | Message<true> | InteractionResponse<true>;
  declare guild: Guild;
  declare _locale: LocaleString | undefined;
  declare initialTimeout: boolean;
  declare initialTimestamp: string | undefined;
  declare initialCancelTimeout: NodeJS.Timeout | undefined;
  declare started: boolean;
  declare channel: GuildTextBasedChannel | null;
  declare messageCollector: MessageCollector | undefined;

  players = new Collection<string, User>();
  deads = new Collection<string, User>();
  giveupers = new Collection<string, User>();
  playersId = [] as string[];
  gifUrl = "https://media1.tenor.com/m/fklGVnlUSFQAAAAd/russian-roulette.gif";
  embed = {} as APIEmbed;
  rounds = 0;
  shoots = 0;
  components = [] as any[];
  bullets = [] as number[];
  playNow = "";
  playNowIndex = 0;
  messageCount = 0;
  gameMode = "" as "reload" | "no_reload";

  constructor(interactionOrMessage: Message<true> | ChatInputCommandInteraction<"cached">) {
    this.interactionOrMessage = interactionOrMessage;
    this.caller = interactionOrMessage instanceof ChatInputCommandInteraction ? interactionOrMessage.user : interactionOrMessage.author;
    this.channelId = interactionOrMessage.channelId;
    this.channel = interactionOrMessage.channel;
    this.guild = interactionOrMessage.guild;
  }

  get maxPlayers() {
    if (this.gameMode === "reload") return 15;
    return 6;
  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (this.interactionOrMessage instanceof Message) {
      const content = this.interactionOrMessage.content || "";
      for (const arg of content?.split(" ") || [] as string[])
        if (KeyOfLanguages[arg as keyof typeof KeyOfLanguages]) {
          this._locale = KeyOfLanguages[arg as keyof typeof KeyOfLanguages] as LocaleString;
          return this._locale;
        }
    }

    if (this.interactionOrMessage instanceof ChatInputCommandInteraction) {

      const fromAutocomplete = this.interactionOrMessage.options.getString("language") as LocaleString;
      if (KeyOfLanguages[fromAutocomplete as keyof typeof KeyOfLanguages]) {
        this._locale = KeyOfLanguages[fromAutocomplete as keyof typeof KeyOfLanguages] as LocaleString;
        return this._locale;
      }

      if (KeyOfLanguages[this.guild?.preferredLocale as keyof typeof KeyOfLanguages]) {
        this._locale = KeyOfLanguages[this.guild?.preferredLocale as keyof typeof KeyOfLanguages] as LocaleString;
        return this._locale;
      }

      this._locale = client.defaultLocale as LocaleString;;
      return this._locale;
    }

    this._locale = KeyOfLanguages[
      (
        this.guild?.preferredLocale
        || this.interactionOrMessage?.userLocale
        || client.defaultLocale
      ) as keyof typeof KeyOfLanguages
    ] as LocaleString;

    if (!KeyOfLanguages[this._locale as keyof typeof KeyOfLanguages])
      this._locale = client.defaultLocale as "pt-BR";

    return this._locale;
  }

  async chooseGameMode() {
    this.enableMessageCounter();
    return await this.reply({
      embeds: [
        {
          color: Colors.Blue,
          title: t("roulette.embeds.title", { e, locale: this.locale }),
          description: t("roulette.embeds.modes_description", { e, locale: this.locale }),
          image: { url: this.gifUrl },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("roulette.buttons.gun_reload", this.locale),
              emoji: parseEmoji(e.GunRight)!,
              custom_id: "reload",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              label: t("roulette.buttons.no_reload", this.locale),
              emoji: parseEmoji("🔫")!,
              custom_id: "no_reload",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              label: t("roulette.buttons.cancel", this.locale),
              emoji: parseEmoji(e.Trash)!,
              custom_id: "cancel",
              style: ButtonStyle.Danger,
            },
          ],
        },
      ],
    })
      .then(msg => {
        this.message = msg;
        this.validadeGameMode();
        return;
      })
      .catch(async err => {
        console.log(err);
        return await this.cancel();
      });
  }

  defineBullets(playersAlive: number) {
    let size = 0;

    if (this.gameMode === "no_reload") {
      size = 6;
    } else {
      if (playersAlive <= 6) size = 6;
      if (playersAlive > 6) size = 15;
    }

    this.bullets = new Array(size).fill(0);
    this.bullets[0] = 1;
    this.bullets = this.bullets.shuffle();
  }

  async validadeGameMode() {
    if (!this.message) return await this.cancel();

    const collector = this.message.createMessageComponentCollector({
      filter: int => int.user.id === this.caller.id,
      time: 1000 * 60,
      componentType: ComponentType.Button,
    })
      .on("collect", async int => {

        const { customId, message } = int;

        if (customId === "cancel") return collector.stop();
        this.gameMode = customId as "reload" | "no_reload";

        const comps = message.components?.map(comp => comp.toJSON()) || [];

        for (const comp of (comps[0] as any).components)
          if (comp) {
            if (comp.custom_id === customId) comp.emoji = e.Loading;
            comp.disabled = true;
          }

        collector.stop("ignore");
        await int.update({ components: comps }).catch(() => { });
        await sleep(3000);
        return await this.lauch();
      })
      .on("end", async (_, reason: CollectorReasonEnd) => {
        if (["time", "idle", "user", "channelDelete", "messageDelete", "guildDelete"].includes(reason))
          return await this.cancel();
      });
  }

  async lauch() {

    this.initialTimestamp = new Date(Date.now() + (1000 * 60) * 5).toISOString();
    this.initialCancelTimeout = setTimeout(() => this.cancel(), (1000 * 60) * 5);

    await (this.message as Message)?.delete().catch(() => { });
    await sleep(1500);
    this.message = await this.reply({
      embeds: [{
        color: Colors.Blue,
        title: t("roulette.embeds.title", { e, locale: this.locale }),
        description: t("roulette.embeds.loadingDescription", { e, locale: this.locale }),
        image: { url: this.gifUrl },
        footer: {
          text: t("roulette.embeds.endingIn", this.locale),
        },
        timestamp: this.initialTimestamp,
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("roulette.buttons.join", { e, locale: this.locale, players: this.players.size, maxPlayers: this.maxPlayers }),
              emoji: "👤",
              custom_id: "join",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              label: t("glass.components.initial.start", {
                locale: this.locale,
                players: this.players.size > 2 ? 2 : this.players.size,
                min: 2,
              }),
              emoji: "🪄",
              custom_id: "start",
              style: ButtonStyle.Success,
              disabled: this.players.size < 2,
            },
            {
              type: 2,
              label: t("teams.components.buttons.leave", this.locale),
              custom_id: "leave",
              emoji: "🏃",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              label: t("teams.components.buttons.cancel", this.locale),
              custom_id: "cancel",
              emoji: e.Trash,
              style: ButtonStyle.Danger,
            },
          ],
        } as any,
      ],
    }).catch(err => {
      console.log(err);
      this.cancel();
      return;
    });

    return this.initialCollector();
  }

  async cancel(): Promise<void> {
    ChannelsInGame.delete(this.channelId);
    if (this.messageCollector) this.messageCollector.stop();
    if (this.message) this.message.delete().catch(() => { });
    return;
  }

  initialCollector() {
    if (!this.message) return ChannelsInGame.delete(this.channelId);
    const collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: () => true,
      time: (1000 * 60) * 5,
    })
      .on("collect", async int => {

        const { user, customId } = int;
        const locale = await user.locale();

        if (customId === "join") {

          if (this.players.size >= this.maxPlayers)
            return await int.reply({
              content: t("roulette.max_players", { e, locale: locale }),
              flags: [MessageFlags.Ephemeral],
            });

          if (this.players.has(user.id))
            return await int.reply({
              content: t("roulette.you_already_in", { e, locale }),
              flags: [MessageFlags.Ephemeral],
            });

          this.players.set(user.id, user);
          this.updateInitialEmbed();
          await int.reply({
            content: t("roulette.you_in", { e, locale }),
            flags: [MessageFlags.Ephemeral],
          });

          if (this.players.size >= this.maxPlayers) {
            collector.stop("ignore");
            return await this.start(int);
          }

          return;
        }

        if (customId === "leave") {
          if (!this.players.has(user.id))
            return await int.reply({
              content: t("roulette.you_already_out", { e, locale }),
              flags: [MessageFlags.Ephemeral],
            });

          this.players.delete(user.id);
          this.updateInitialEmbed();
          return await int.reply({
            content: t("roulette.you_out", { e, locale }),
            flags: [MessageFlags.Ephemeral],
          });
        }

        if (customId === "start") {
          if (user.id !== this.caller.id)
            return await int.reply({
              content: t("roulette.you_cannot_start", { e, caller: this.caller, locale: this.locale }),
              flags: [MessageFlags.Ephemeral],
            });
          collector.stop("ignore");
          return await this.start(int);
        }

        if (customId === "cancel") {

          if (user.id !== this.caller.id)
            return await int.reply({
              content: t("roulette.you_cannot_cancel", { e, caller: this.caller, locale: this.locale }),
              flags: [MessageFlags.Ephemeral],
            });

          collector.stop("ignore");
          await this.cancel();
          return;
        }

      })
      .on("end", async (_, reason: CollectorReasonEnd | "ignore") => {

        if (reason === "ignore") return;
        if (reason === "messageDelete") {
          if (this.channel) {
            this.message = await this.channel.send({
              content: (this.message as Message)?.content,
              embeds: (this.message as Message)?.embeds || [],
              components: (this.message as Message)?.components || [],
            });
            this.initialCollector();
          }
        }

        if (["time", "idle", "user", "limit", "channelDelete", "guildDelete"].includes(reason))
          return await this.cancel();

      });

    return;
  }

  async start(int: ButtonInteraction) {

    this.playersId = Array.from(this.players.keys());
    this.rounds++;
    this.defineBullets(this.players.size);
    const message = int.message as Message<true>;
    this.message = message;

    if (message) {
      this.embed = message.embeds?.[0]?.toJSON() || {};
      delete this.embed.footer;
      const comps = message.components?.map(comp => comp.toJSON()) || [];

      for (const comp of (comps[0] as any).components)
        if (comp) {
          if (comp.custom_id === "start") comp.emoji = e.Loading;
          comp.disabled = true;
        }

      await int.update({ components: comps }).catch(() => { });
    }

    delete this.embed.image;
    delete this.embed.timestamp;
    this.embed.description = this.playerDescription;
    this.playNow = this.players.firstKey()!;

    this.embed.fields = [
      {
        name: t("roulette.embeds.fields.play_name", { locale: this.locale, round: this.rounds }),
        value: t("roulette.embeds.fields.play_value", { e, locale: this.locale, player: this.players.get(this.playNow) }),
      },
    ];

    this.refreshPlayComponents();
    await sleep(1500);
    const data = {
      embeds: [this.embed],
      components: this.components,
    };

    if (this.messageCount > 3) {
      message.delete().catch(() => { });
      this.messageCount = 0;
      this.message = await this.channel?.send(data)
        .catch(async () => await this.cancel());
    } else this.message = await this.message.edit(data)
      .catch(async () => await this.cancel());

    if (!this.message) return;
    return await this.enableNewRoundCollector();

  }

  get playerDescription() {
    return [
      this.players.valuesToArray(),
      this.giveupers.valuesToArray(),
      this.deads.valuesToArray(),
    ]
      .flat()
      .map(player => `${this.emoji(player.id)} ${player}`)
      .join("\n") || t("roulette.embeds.no_players", { e, locale: this.locale });
  }

  emoji(userId: string) {
    if (this.players.has(userId)) return "👤";
    if (this.deads.has(userId)) return "☠️";
    if (this.giveupers.has(userId)) return "🏳️";
    return "❔";
  }

  async nextRound(): Promise<any> {

    if (!this.playersId?.length || !this.players.size || this.shoots > this.maxPlayers)
      return await this.cancel();

    if (this.players.size === 1) {
      await this.cancel();
      return await this.channel?.send({
        content: t("roulette.last_survivor", { e, locale: this.locale, player: this.players.first() }),
        embeds: [{
          color: Colors.Blue,
          title: t("roulette.embeds.title", { e, locale: this.locale }),
          description: this.playerDescription,
        }],
      });
    }


    if (this.playNowIndex < 0) this.playNowIndex = 0;

    if (!this.playersId[this.playNowIndex]) {
      this.playNowIndex = 0;
      return await this.nextRound();
    }

    this.playNow = this.playersId[this.playNowIndex];
    this.rounds++;

    if (this.message)
      this.embed = (this.message as Message)?.embeds?.[0]?.toJSON() || {};

    this.embed.fields = [
      {
        name: t("roulette.embeds.fields.play_name", { locale: this.locale, round: this.rounds }),
        value: t("roulette.embeds.fields.play_value", { e, locale: this.locale, player: this.players.get(this.playNow) }),
      },
    ];

    this.embed.description = this.playerDescription;

    this.refreshPlayComponents();
    await sleep(1500);

    const payload = {
      embeds: [this.embed],
      components: this.components,
    };

    if (this.messageCount > 3) {
      this.messageCount = 0;
      await (this.message as Message)?.delete().catch(() => { });
      this.message = await this.channel?.send(payload).catch(async () => await this.cancel());
    } else (this.message as Message).edit(payload).catch(async () => await this.cancel());

    if (!this.message) return await this.cancel();
    return await this.enableNewRoundCollector();
  }

  async enableNewRoundCollector() {
    if (!this.message) return await this.cancel();

    const collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: int => int.user.id === this.playNow,
      time: 1000 * 30,
    })
      .on("collect", async int => {

        const { user, customId, message } = int;

        if (customId === "giveup") {
          this.removePlayer(user.id);
          this.giveupers.set(user.id, user);
          collector.stop("ignore");
          return await this.nextRound();
        }

        if (customId === "shoot") {
          const shoot = this.bullets.splice(0, 1)[0];
          this.shoots++;

          const embed = message.embeds?.[0]?.toJSON() || {};

          if (shoot) {
            collector.stop();
            this.removePlayer(user.id);
            this.deads.set(user.id, user);
            embed.description = this.playerDescription;
            embed.fields = [];

            if (this.gameMode === "no_reload") {
              await this.cancel();
              return await this.channel?.send({
                content: t("roulette.shoot_yourself", { e, locale: this.locale, user }),
                embeds: [embed],
              }).catch(() => { });
            } else {
              this.defineBullets(this.players.size);
              this.shoots = 0;
              await this.channel?.send({
                content: t("roulette.shoot_yourself", { e, locale: this.locale, user }),
              }).catch(() => { });
            }

            if (this.players.size === 1) {
              await this.cancel();
              embed.fields = [];
              return await this.channel?.send({
                content: t("roulette.last_survivor", { e, locale: this.locale, player: this.players.first() }),
                embeds: [embed],
              });
            }

          }

          this.playNowIndex++;
          collector.stop();

          await int.update({
            embeds: [embed],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    label: t("roulette.buttons.shoot", { locale: this.locale, bullets: this.bullets.length }),
                    emoji: e.GunRight,
                    custom_id: "shoot",
                    style: ButtonStyle.Success,
                    disabled: true,
                  },
                  {
                    type: 2,
                    label: t("roulette.buttons.giveup", { locale: this.locale }),
                    emoji: "🏳️",
                    custom_id: "giveup",
                    style: ButtonStyle.Danger,
                    disabled: true,
                  },
                ],
              },
            ] as any[],
          });

          await sleep(2000);
          return await this.nextRound();
        }

      })
      .on("end", async (_, reason: CollectorReasonEnd) => {

        if (reason === "messageDelete") {
          this.message = await this.channel?.send({
            embeds: [this.embed],
            components: this.components,
          })
            .catch(async () => await this.cancel());
          await this.enableNewRoundCollector();
          return;
        }

        if (reason === "time") {
          await this.channel?.send({
            content: t("roulette.eliminated", { e, locale: this.locale, user: this.players.get(this.playNow) }),
          });
          this.deads.set(this.playNow, this.players.get(this.playNow)!);
          this.removePlayer(this.playNow);
          return await this.nextRound();
        }

        if (["limit", "channelDelete", "messageDelete", "guildDelete"].includes(reason))
          return await this.cancel();
      });

  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);
    this.playNowIndex++;
    this.playersId = this.players.keysToArray();
  }

  refreshPlayComponents() {
    this.components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("roulette.buttons.shoot", { locale: this.locale, bullets: this.bullets.length }),
            emoji: e.GunRight,
            custom_id: "shoot",
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            label: t("roulette.buttons.giveup", { locale: this.locale }),
            emoji: "🏳️",
            custom_id: "giveup",
            style: ButtonStyle.Danger,
          },
        ],
      },
    ];
    return;
  }

  async updateInitialEmbed() {

    if (this.initialTimeout) return;

    this.initialTimeout = true;
    await sleep(2000);
    if (this.started) return;
    let description = t("roulette.embeds.loadingDescription", { e, locale: this.locale });
    if (this.players.size) description += "\n \n" + this.playerDescription;

    return await (this.message as Message).edit({
      embeds: [{
        color: Colors.Blue,
        title: t("roulette.embeds.title", { e, locale: this.locale }),
        description,
        image: { url: this.gifUrl },
        footer: {
          text: t("roulette.embeds.endingIn", this.locale),
        },
        timestamp: this.initialTimestamp,
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("roulette.buttons.join", { locale: this.locale, players: this.players.size, maxPlayers: this.maxPlayers }),
              emoji: "👤",
              custom_id: "join",
              style: ButtonStyle.Primary,
              disabled: this.players.size >= this.maxPlayers,
            },
            {
              type: 2,
              label: t("glass.components.initial.start", {
                locale: this.locale,
                players: this.players.size >= 2 ? 2 : this.players.size,
                min: 2,
              }),
              emoji: "🪄",
              custom_id: "start",
              style: ButtonStyle.Success,
              disabled: this.players.size < 2,
            },
            {
              type: 2,
              label: t("teams.components.buttons.leave", this.locale),
              emoji: "🏃",
              custom_id: "leave",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              label: t("teams.components.buttons.cancel", this.locale),
              custom_id: "cancel",
              emoji: e.Trash,
              style: ButtonStyle.Danger,
            },
          ],
        } as any,
      ],
    })
      .then(msg => {
        this.initialTimeout = false;
        return msg;
      })
      .catch(() => async (err: Error) => {
        console.log(err);
        return await this.cancel();
      });
  }

  async reply(payload: MessagePayload | InteractionReplyOptions): Promise<Message<true> | InteractionResponse<true>> {
    if (this.interactionOrMessage instanceof ChatInputCommandInteraction) {
      (payload as InteractionReplyOptions).fetchReply = true;
      return await this.interactionOrMessage.reply(payload);
    }

    return await this.interactionOrMessage.reply(payload as MessagePayload);
  }

  enableMessageCounter() {
    if (!this.channel) return;
    this.messageCollector = this.channel.createMessageCollector({
      filter: () => true,
      idle: 1000 * 60,
    })
      .on("collect", async message => {

        const { attachments, embeds } = message;

        if (embeds.length) this.messageCount += embeds.length * 3;
        if (attachments.size) this.messageCount += attachments.size * 2;
        this.messageCount++;

      });

  }

}
