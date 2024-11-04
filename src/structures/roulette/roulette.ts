import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, ComponentType, GuildTextBasedChannel, InteractionReplyOptions, InteractionResponse, LocaleString, Message, MessageCollector, MessagePayload, parseEmoji, User } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";
import { ChannelsInGame, KeyOfLanguages } from "../../util/constants";
import { setTimeout as sleep } from "timers/promises";
import { CollectorEnding } from "../../@types/commands";

export default class RussianRoulette {

  declare interactionOrMessage: Message<true> | ChatInputCommandInteraction<"cached">;
  declare caller: User;
  declare channelId: string;
  declare message: void | Message<true> | InteractionResponse<true>;
  declare _locale: LocaleString | undefined;
  declare initialTimeout: boolean;
  declare initialTimestamp: string | undefined;
  declare initialCancelTimeout: NodeJS.Timeout | undefined;
  declare started: boolean;
  declare channel: GuildTextBasedChannel | null;
  declare messageCollector: MessageCollector | undefined;

  players = new Collection<string, User>();
  playersId = [] as string[];
  bullets = [0, 0, 1, 0, 0, 0].shuffle();
  gifUrl = "https://media1.tenor.com/m/fklGVnlUSFQAAAAd/russian-roulette.gif";
  embed = {} as APIEmbed;
  rounds = 0;
  shoots = 0;
  components = [] as any[];
  playNow = "";
  playNowIndex = 0;
  messageCount = 0;
  gameMode = "" as "reload" | "no_reload";

  constructor(interactionOrMessage: Message<true> | ChatInputCommandInteraction<"cached">) {
    this.interactionOrMessage = interactionOrMessage;
    this.caller = interactionOrMessage instanceof ChatInputCommandInteraction ? interactionOrMessage.user : interactionOrMessage.author;
    this.channelId = interactionOrMessage.channelId;
    this.channel = interactionOrMessage.channel;
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

  async chooseGameMode() {
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

        for (const comp of comps[0].components)
          if (comp) {
            // @ts-expect-error ignore
            if (comp.custom_id === customId) comp.emoji = e.Loading;
            comp.disabled = true;
          }

        collector.stop("ignore");
        await int.update({ components: comps }).catch(() => { });
        await sleep(3000);
        return await this.lauch();
      })
      .on("end", async (_, reason: CollectorEnding) => {
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
              label: t("teams.components.buttons.join", this.locale),
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

    this.enableMessageCounter();
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

          if (this.players.size >= 6)
            return await int.reply({
              content: t("roulette.max_players", { e, locale: locale }),
              ephemeral: true,
            });

          if (this.players.has(user.id))
            return await int.reply({
              content: t("roulette.you_already_in", { e, locale }),
              ephemeral: true,
            });

          this.players.set(user.id, user);
          this.updateInitialEmbed();
          return await int.reply({
            content: t("roulette.you_in", { e, locale }),
            ephemeral: true,
          });
        }

        if (customId === "leave") {
          if (!this.players.has(user.id))
            return await int.reply({
              content: t("roulette.you_already_out", { e, locale }),
              ephemeral: true,
            });

          this.players.delete(user.id);
          this.updateInitialEmbed();
          return await int.reply({
            content: t("roulette.you_out", { e, locale }),
            ephemeral: true,
          });
        }

        if (customId === "start") {
          if (user.id !== this.caller.id)
            return await int.reply({
              content: t("roulette.you_cannot_start", { e, caller: this.caller, locale: this.locale }),
              ephemeral: true,
            });
          collector.stop("ignore");
          return await this.start(int);
        }

        if (customId === "cancel") {

          if (user.id !== this.caller.id)
            return await int.reply({
              content: t("roulette.you_cannot_cancel", { e, caller: this.caller, locale: this.locale }),
              ephemeral: true,
            });

          collector.stop("ignore");
          await this.cancel();
          return;
        }

      })
      .on("end", async (_, reason: CollectorEnding | "ignore") => {

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
    const message = int.message as Message<true>;
    this.message = message;

    if (message) {
      this.embed = message.embeds?.[0]?.toJSON() || {};
      delete this.embed.footer;
      const comps = message.components?.map(comp => comp.toJSON()) || [];

      for (const comp of comps[0].components)
        if (comp) {
          // @ts-expect-error ignore
          if (comp.custom_id === "start") comp.emoji = e.Loading;
          comp.disabled = true;
        }

      await int.update({ components: comps }).catch(() => { });
    }

    delete this.embed.image;
    this.embed.description = this.playerDescription;
    delete this.embed.timestamp;
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
    return this.players.valuesToArray()
      .map(player => `👤 ${player}`)
      .join("\n");
  }

  async nextRound(): Promise<any> {

    if (!this.playersId?.length || this.shoots > 6)
      return await this.cancel();

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

    // You forget the description
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

    if (!this.message) return;
    return await this.enableNewRoundCollector();
  }

  async enableNewRoundCollector() {
    if (!this.message) return await this.cancel();

    const collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: int => int.user.id === this.playNow,
      time: (1000 * 60) * 2,
    })
      .on("collect", async int => {

        const { user, customId } = int;

        if (customId === "giveup") {
          this.removePlayer(user.id);
          collector.stop("ignore");
          return await this.nextRound();
        }

        if (customId === "shoot") {
          const shoot = this.bullets.splice(0, 1)[0];
          this.shoots++;

          if (shoot) {
            collector.stop();
            await this.channel?.send({
              content: t("roulette.shoot_yourself", { e, locale: this.locale, user }),
            }).catch(() => { });

            if (this.gameMode === "no_reload") {
              await this.cancel();
            } else {
              this.removePlayer(user.id);
              this.bullets = [0, 0, 1, 0, 0, 0].shuffle();
              this.shoots = 0;
            }

          }

          this.playNowIndex++;
          collector.stop();

          await int.update({
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    label: t("roulette.buttons.shoot", { locale: this.locale, shoots: this.shoots }),
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
      .on("end", async (_, reason: CollectorEnding) => {

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
          this.removePlayer(this.playNow);
          return await this.nextRound();
        }

        if (["limit", "channelDelete", "messageDelete", "guildDelete"].includes(reason))
          return await this.cancel();
      });

  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);
    this.playersId = this.players.keysToArray();
  }

  refreshPlayComponents() {
    this.components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("roulette.buttons.shoot", { locale: this.locale, shoots: this.shoots }),
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
    if (this.players.size) description += "\n" + this.playerDescription;

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
              label: t("roulette.buttons.join", { locale: this.locale, players: this.players.size }),
              emoji: "👤",
              custom_id: "join",
              style: ButtonStyle.Primary,
              disabled: this.players.size >= 6,
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
    this.messageCollector = this.channel.createMessageCollector({ filter: () => true })
      .on("collect", async message => {

        const { attachments, embeds } = message;

        if (embeds.length) this.messageCount += embeds.length * 3;
        if (attachments.size) this.messageCount += attachments.size * 2;
        this.messageCount++;

      });

  }

}
