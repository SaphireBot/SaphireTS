import { APIEmbed, APIEmbedField, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, ComponentType, Guild, GuildTextBasedChannel, InteractionResponse, LocaleString, Message, MessageFlags, parseEmoji, User } from "discord.js";
import { allWordTranslations, ChannelsInGame, KeyOfLanguages } from "../../util/constants";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import { CollectorReasonEnd } from "../../@types/commands";
import Database from "../../database";
const defaultAnimals = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐒", "🐸", "🐷", "🐮", "🦁", "🐯", "🦆", "🦅", "🦉", "🐴", "🐦", "🐧", "🐢", "🦋", "🦄", "🐓"];

export default class JogoDoBicho {

  players = new Collection<string, User>();
  maxAnimals = 2;
  minPlayersToStart = 5;
  _buttonsHasBeenGenerated = false;
  components = [].asMessageComponents();
  animals = {} as Record<string, Set<string>>;
  joins = {} as Record<string, number>;
  betValue = 0;

  declare guild: Guild;
  declare author: User;
  declare channelId: string;
  declare _locale: LocaleString;
  declare interaction: Message<true> | ChatInputCommandInteraction<"cached">;
  declare channel: GuildTextBasedChannel;
  declare message: Message<boolean> | InteractionResponse<true> | undefined | null;
  declare messageConfirmation: Message<true> | InteractionResponse<true> | undefined;
  declare interval: NodeJS.Timeout | undefined;

  constructor(interaction: Message<true> | ChatInputCommandInteraction<"cached">) {
    this.interaction = interaction;
    this.guild = interaction.guild;
    this.author = interaction instanceof Message ? interaction.author : interaction.user;
    this.channelId = interaction.channelId;
    this.channel = interaction.channel as GuildTextBasedChannel;
    this.generateButtons();
  }

  get randomEmoji() {
    return defaultAnimals.random();
  }

  get description(): string {

    if (!this.players.size)
      return t("bicho.embed.no_players", { locale: this.locale, e });

    let text = Object.entries(this.animals)
      .filter(([_, players]) => players.size)
      .map(([animal, players]) => t("bicho.embed.description", { animal, players: players.size }))
      .join("\n")
      .limit("EmbedFieldValue");

    text += `\n \n${t("blackjack.awaiting_players", { e, locale: this.locale })}`;
    return text;
  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (this.interaction instanceof Message)
      for (const arg of this.interaction.content?.split(" ") || [] as string[])
        if (KeyOfLanguages[arg as keyof typeof KeyOfLanguages]) {
          this._locale = KeyOfLanguages[arg as keyof typeof KeyOfLanguages] as LocaleString;
          return this._locale;
        }

    if (this.interaction instanceof ChatInputCommandInteraction) {

      const fromAutocomplete = this.interaction.options.getString("language") as LocaleString;
      if (KeyOfLanguages[fromAutocomplete as keyof typeof KeyOfLanguages]) {
        this._locale = KeyOfLanguages[fromAutocomplete as keyof typeof KeyOfLanguages] as LocaleString;
        return this._locale;
      }

      if (KeyOfLanguages[this.guild?.preferredLocale as keyof typeof KeyOfLanguages]) {
        this._locale = KeyOfLanguages[this.interaction.guild?.preferredLocale as keyof typeof KeyOfLanguages] as LocaleString;
        return this._locale;
      }

      this._locale = client.defaultLocale as LocaleString;;
      return this._locale;
    }

    this._locale = KeyOfLanguages[
      (
        this.guild?.preferredLocale
        || client.defaultLocale
      ) as keyof typeof KeyOfLanguages
    ] as LocaleString;

    if (!KeyOfLanguages[this._locale as keyof typeof KeyOfLanguages])
      this._locale = client.defaultLocale as "pt-BR";

    return this._locale;
  }

  get fields(): APIEmbedField[] {
    if (this.betValue <= 0) return [];

    return [{
      name: t("bicho.bet.fieldName", { e, locale: this.locale }),
      value: t("bicho.bet.fieldValue", {
        e,
        locale: this.locale,
        betValue: this.betValue.currency(),
        accumulate: (this.betValue * this.players.size).currency(),
      }),
    }];
  }

  get embeds(): APIEmbed[] {
    return [{
      color: Colors.Blue,
      title: t("bicho.embed.title", { emoji: this.randomEmoji, emoji2: this.randomEmoji, locale: this.locale }),
      description: this.description,
      fields: this.fields,
    }];
  }

  get payload() {
    return {
      embeds: this.embeds,
      components: this.components,
    };
  }

  get confirmationPayload() {
    return {
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("bicho.components.draw", {
                locale: this.locale,
                players: this.players.size > this.minPlayersToStart ? this.minPlayersToStart : this.players.size,
                minPlayers: this.minPlayersToStart,
              }),
              emoji: parseEmoji(e.Animated.SaphireDance),
              custom_id: "draw",
              style: ButtonStyle.Success,
              disabled: this.players.size < this.minPlayersToStart,
            },
            {
              type: 2,
              label: t("bicho.components.cancel", this.locale),
              emoji: parseEmoji(e.Trash),
              custom_id: "cancel",
              style: ButtonStyle.Danger,
            },
          ],
        },
      ].asMessageComponents(),
    };
  }

  async defineBetValue() {

    let value = 0;

    if (this.interaction instanceof Message)
      await (async () => {

        const args = (this.interaction as Message).content.split(" ");

        if (args?.some(str => allWordTranslations.includes(str?.toLowerCase())))
          return value = (await Database.getUser(this.author.id))?.Balance || 0;

        let v = 0;
        for (const arg of args || [])
          if (typeof arg === "string") {
            const num = arg.toNumber();
            if (typeof num === "number" && num > 0
            )
              v += num;
          }
        return value = v;
      })();
    else value = this.interaction.options.getInteger("amount") || 0;

    this.betValue = value;
    return;
  }

  async lauch() {

    ChannelsInGame.add(this.channelId);
    await this.defineBetValue();

    try {

      if (this.interaction instanceof Message)
        this.message = await this.interaction.reply(this.payload);

      if (this.interaction instanceof ChatInputCommandInteraction) {
        this.message = await this.interaction.reply({
          ...this.payload,
          withResponse: true,
        }).then(res=>res.resource?.message);
      }

      this.messageConfirmation = await this.channel.send(this.confirmationPayload);

    } catch (err) {
      await this.cancel(true);
      if (!this.channel) return;
      return await this.channel.send({
        content: t("bicho.content.error", { e, locale: this.locale, err }),
      });
    }

    return await this.startCollector();
  }

  addJoin(userId: string) {
    if (!this.joins[userId]) this.joins[userId] = 0;
    this.joins[userId] = this.joins[userId] + 1;
    return this.joins[userId];
  }

  setEmojiUser(userId: string, emoji: string) {
    if (!this.animals[emoji]) this.animals[emoji] = new Set();
    this.animals[emoji].add(userId);
  }

  async refreshEmbed() {
    if (!this.message || !this.messageConfirmation) return await this.cancel(true, "Messages Origins not found");

    await this.message.edit(this.payload)
      .catch(async () => await this.cancel(true, "Error to edit the originals message"));

    await this.messageConfirmation.edit(this.confirmationPayload)
      .catch(async () => await this.cancel(true, "Error to edit the originals message"));

    return;
  }

  async startCollector() {
    if (!this.message || !this.messageConfirmation) return await this.cancel(true, "Message origin not found");

    this.interval = setInterval(async () => await this.refreshEmbed(), 2500);
    await Database.Games.set(`Bicho.${this.channelId}.value`, this.betValue);

    const messageCollector = this.message.createMessageComponentCollector({
      filter: () => true,
      idle: (1000 * 60) * 5,
      componentType: ComponentType.Button,
    });

    const confirmationCollector = this.messageConfirmation.createMessageComponentCollector({
      filter: () => true,
      time: (1000 * 60) * 30,
      componentType: ComponentType.Button,
    });

    this.players.set(client.user!.id, client.user!);
    for (let i = 0; i < 2; i++) {
      const emoji = defaultAnimals.random();
      if (!client.user) break;
      this.animals[emoji].add(client.user.id);
      this.addJoin(client.user.id);
    }

    messageCollector
      .on("collect", async int => {

        const { customId: emoji, user } = int;
        const locale = await user.locale();

        if ((this.joins[user.id] || 0) >= 2)
          return await int.reply({
            content: t("bicho.content.you_already_join", { e, locale }),
            flags: [MessageFlags.Ephemeral],
          });

        if (!this.animals[emoji]) this.animals[emoji] = new Set();

        if (this.animals[emoji].has(user.id))
          return await int.reply({
            content: t("bicho.content.you_pickup_it", { e, locale }),
            flags: [MessageFlags.Ephemeral],
          });

        await int.reply({
          content: `${e.Loading} ${t("keyword_loading", locale)}`,
          flags: [MessageFlags.Ephemeral],
        });

        if (!this.players.has(user.id)) {

          if (this.betValue > 0) {
            const data = await Database.getUser(user.id);
            const balance = data?.Balance || 0;

            if (balance < this.betValue)
              return await int.editReply({ content: t("bicho.bet.no_balance", { e, value: this.betValue, locale }) });

            await Database.editBalance(
              user.id,
              {
                createdAt: new Date(),
                keywordTranslate: "bicho.transactions.loss",
                method: "sub",
                mode: "bicho",
                type: "loss",
                value: this.betValue,
              },
            );

            await Database.Games.push(`Bicho.${this.channelId}.users`, user.id);

          }

          this.players.set(user.id, user);
        }

        this.animals[emoji].add(user.id);
        const joins = this.addJoin(user.id);

        return await int.editReply({
          content: t("bicho.content.you_subscribe", {
            e,
            locale,
            emoji,
            count: joins,
          }),
        });

      })
      .on("end", async (_, reason: CollectorReasonEnd) => {
        clearInterval(this.interval);

        if (reason === "user") return;
        if (reason === "messageDelete") {
          await this.cancel(true, "Message has been deleted.");
          confirmationCollector.stop();
          return await this.messageConfirmation?.delete()?.catch(() => { });
        }

        if (["channelDelete", "guildDelete"].includes(reason))
          return await this.cancel(true);

        if (["idle", "time"].includes(reason))
          return await this.cancel(true, "time");
      });

    confirmationCollector
      .on("collect", async int => {

        const { user, customId } = int;
        const locale = await user.locale();

        if (user.id !== this.author.id)
          return await int.reply({
            content: t("reminder.you_cannot_click_here", { e, locale }),
            flags: [MessageFlags.Ephemeral],
          });

        if (customId === "cancel") {
          await this.cancel(true);
          messageCollector.stop();
          confirmationCollector.stop();
          await this.message?.delete()?.catch(() => { });
          return await this.messageConfirmation?.delete()?.catch(() => { });
        }

        if (customId === "draw") {
          await int.deferUpdate();
          messageCollector.stop();
          confirmationCollector.stop();
          await this.message?.delete()?.catch(() => { });
          await this.messageConfirmation?.delete()?.catch(() => { });
          await sleep(2000);
          return await this.start(int);
        }

      })
      .on("end", async (_, reason: CollectorReasonEnd) => {
        clearInterval(this.interval);

        if (reason === "user") return;
        if (reason === "messageDelete") {
          await this.cancel(true, "Message has been deleted.");
          messageCollector.stop();
          return await this.message?.delete()?.catch(() => { });
        }

        if (["channelDelete", "guildDelete"].includes(reason))
          return await this.cancel(true);

        if (["idle", "time"].includes(reason))
          return await this.cancel(true, "time");
      });

    return;
  }

  async start(int: ButtonInteraction) {
    clearInterval(this.interval);

    this.message = await int.followUp({
      content: t("bicho.content.welcome", {
        emoji: this.randomEmoji,
        emoji1: this.randomEmoji,
        locale: this.locale,
      }),
      withResponse: true,
    });

    let i = 0;
    do {

      await sleep(2000);

      if (!this.message) {
        i = 5;
        await this.cancel(true);
        break;
      }

      this.message = await this.message.edit({
        content: t("bicho.content.welcome", {
          emoji: this.randomEmoji,
          emoji1: this.randomEmoji,
          locale: this.locale,
        }),
      })
        .catch(() => undefined);

      if (!this.message) break;
      i++;
    } while (i < 3);

    if (!this.message)
      return await this.cancel(true, "Origin message not found.");

    await this.cancel(false);
    await sleep(2000);
    return await this.draw();
  }

  async draw() {

    const animal = Object.entries(this.animals)
      .filter(([_, players]) => players.size)
      .random();

    const emoji = animal[0];
    const players = animal[1];

    if (!players.size) {
      this.cancel(true);
      return await this.message?.edit({
        content: t("bicho.content.finish_no_winner", {
          e,
          locale: this.locale,
          emoji,
          players: players.size || 0,
        }),
      }).catch(async () => await this.cancel(false, "Error to show the finish message"));
    }

    const winner = this.players.get(Array.from(players).random());
    if (!winner) return await this.cancel(true, "No winner found");

    await Database.editBalance(
      winner.id,
      {
        createdAt: new Date(),
        keywordTranslate: "bicho.transactions.gain",
        method: "add",
        mode: "bicho",
        type: "gain",
        value: this.betValue * this.players.size,
      },
    );

    return await this.message?.edit({
      content: t("bicho.content.finish", {
        e,
        locale: this.locale,
        emoji,
        winner,
        players: players.size || 0,
      }),
    })
      .catch(async () => await this.cancel(false, "Error to show the finish message"));
  }

  async cancel(refund: boolean, message?: string) {
    ChannelsInGame.delete(this.channelId);
    clearInterval(this.interval);

    if (refund)
      await this.refund();

    if (message === "time") {
      await this.message?.delete()?.catch(() => { });
      await this.messageConfirmation?.delete()?.catch(() => { });
      return;
    }

    if (message)
      return await this.channel?.send({
        content: t("bicho.content.error", { e, locale: this.locale, err: message }),
      }).catch(() => { });
  }

  generateButtons() {

    const animals = defaultAnimals.shuffle();

    for (const animal of animals)
      this.animals[animal] = new Set();

    for (let i = 0; i < 25; i += 5) {

      const component = {
        type: 1,
        components: animals.slice(i, i + 5)
          .map(animal => ({
            type: 2,
            emoji: parseEmoji(animal),
            custom_id: animal,
            style: ButtonStyle.Secondary,
          })),
      };

      this.components.push(component);
    }

    return;
  }

  async refund() {
    for await (const player of this.players.values())
      await Database.editBalance(
        player.id,
        {
          createdAt: new Date(),
          keywordTranslate: "bicho.transactions.refund",
          method: "add",
          mode: "bicho",
          type: "system",
          value: this.betValue,
        },
      );

    await Database.Games.delete(`Bicho.${this.channelId}`);
  }
}