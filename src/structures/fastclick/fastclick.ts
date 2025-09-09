import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, Guild, LocaleString, Message, TextChannel, User, parseEmoji } from "discord.js";
import { ChannelsInGame, KeyOfLanguages } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import { mapButtons } from "djs-protofy";
import { randomInt } from "crypto";
import client from "../../saphire";

export default class FastClick {

  defaultButtonsAmount = 25;
  defaultPointsAmount = 15;
  defaultSecondsOfCooldown = 3;
  timeToAwaitForTheClick = 5000;
  cooldownCount = 0;
  players = new Collection<string, User>();
  counter = new Map<string, number>();

  declare _locale: LocaleString;
  declare channel: TextChannel;
  declare channelId: string;
  declare guild: Guild;
  declare interaction: ChatInputCommandInteraction<"cached"> | Message<true>;
  declare user: User;
  declare args?: string[];
  declare message?: Message<boolean> | undefined | null | void;
  declare buttonsAmount: number;
  declare totalPoints: number;

  constructor(interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>, args?: string[]) {
    this.channel = interactionOrMessage.channel as TextChannel;
    this.channelId = interactionOrMessage.channelId;
    this.guild = interactionOrMessage.guild;
    this.interaction = interactionOrMessage;
    this.user = "user" in interactionOrMessage ? interactionOrMessage.user : interactionOrMessage.author;
    this.args = args;

    this.buttonsAmount = ((): number => {

      let amount = this.defaultButtonsAmount;

      if (this.interaction instanceof ChatInputCommandInteraction)
        amount = this.interaction.options.getInteger("buttons") || amount;

      if (this.interaction instanceof Message)
        amount = Number(this.args?.[0] || amount);

      if (amount < 3) amount = 3;
      if (amount > 25) amount = 25;
      if (!amount || isNaN(amount)) amount = this.defaultButtonsAmount;

      return amount;
    })();

    this.totalPoints = ((): number => {

      let amount = this.defaultPointsAmount;

      if (this.interaction instanceof ChatInputCommandInteraction)
        amount = this.interaction.options.getInteger("points") || amount;

      if (this.interaction instanceof Message)
        amount = Number(this.args?.[1] || amount);

      if (amount < 5) amount = 5;
      if (amount > 1000) amount = 1000;
      if (!amount || isNaN(amount)) amount = this.defaultPointsAmount;

      return amount;
    })();

    this.checkBeforeInicialize();
  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (this.interaction instanceof Message) {
      const content = this.interaction.content || "";
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

  async checkBeforeInicialize() {

    if (ChannelsInGame.has(this.channelId))
      return await this.reply({
        content: t("battleroyale.a_party_in_running", { e, locale: this.locale }),
      });

    ChannelsInGame.add(this.channelId);
    return await this.init();
  }

  async init() {

    this.message = await this.reply({
      content: t("fastclick.initing", { e, locale: this.locale }),
      components: this.generateButtons(),
    });

    if (!this.message) return this.cancel();
    return await this.cooldown();
  }

  async cooldown(): Promise<any> {

    await sleep(1300);
    const components = mapButtons(this.message!.components, (button) => {
      if ("emoji" in button) button.emoji = undefined;
      if ("label" in button) button.label = `${this.defaultSecondsOfCooldown - this.cooldownCount}`;
      return button;
    });

    const ok = await this.edit({ components }).catch(() => this.cancel());
    if (!ok) return;

    this.cooldownCount++;
    if (this.cooldownCount >= this.defaultSecondsOfCooldown) {
      await sleep(1300);
      this.cooldownCount = 1;

      const customId = `${randomInt(this.buttonsAmount - 1)}`;
      const components = mapButtons(this.message!.components, (button) => {
        if (!("label" in button) || !("custom_id" in button)) return button;

        button.emoji = parseEmoji(e.GrayStar)!;
        button.label = undefined;
        button.style = ButtonStyle.Secondary;
        if (button.custom_id === customId) {
          button.emoji = parseEmoji(e.Star) || undefined;
          if (!button.emoji) button.label = e.Star;
          button.style = ButtonStyle.Success;
          button.disabled = false;
        }
        return button;
      });

      const ok = await this.edit({ components })
        .catch(async err => {
          console.log(err);
          return await this.cancel();
        });

      if (!ok) return;
      return this.enableCollector();
    }

    return await this.cooldown();
  }

  enableCollector() {
    this.message?.createMessageComponentCollector({
      filter: () => true,
      time: this.timeToAwaitForTheClick,
      max: 1,
    })
      .on("collect", this.collect.bind(this))
      .on("end", async (_, reason: string) => {
        if (reason === "limit") return;
        return await this.cancel();
      });
  }

  async collect(int: ButtonInteraction<"cached">) {
    const { user } = int;
    if (!this.players.has(user.id)) this.players.set(user.id, user);
    const points = (this.counter.get(user.id) || 0) + 1;
    this.counter.set(int.user.id, points);

    if (points >= this.totalPoints)
      return await this.finish();

    return await int.update({
      content: null,
      embeds: [{
        color: Colors.Blue,
        title: t("fastclick.embed.title", { e, locale: this.locale }),
        description: this.rankingDescription(),
        fields: [
          {
            name: t("fastclick.embed.fields.0.name", this.locale),
            value: t("fastclick.embed.fields.0.value", {
              locale: this.locale,
              total: this.totalPoints,
            }),
          },
        ],
      }],
    })
      .then(async () => {
        const ok = await this.message?.edit({
          components: this.generateButtons(),
        }).catch(() => this.cancel());
        if (!ok) return this.cancel();
        return await this.cooldown();
      })
      .catch(() => this.cancel());
  }

  async finish() {

    ChannelsInGame.delete(this.channelId);

    if (this.message)
      await this.message?.delete().catch(() => { });

    return await this.channel.send({
      embeds: [{
        color: Colors.Blue,
        title: t("fastclick.embed.title", this.locale),
        description: `👑 ${this.rankingDescription()}`.limit("EmbedDescription"),
      }],
    });
  }

  async cancel() {
    ChannelsInGame.delete(this.channelId);
    await this.message?.delete().catch(() => { });
    return;
  }

  rankingDescription() {
    return Array.from(
      this.counter.entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([userId, points], i) => {
        return t("fastclick.embed.description", {
          locale: this.locale,
          user: this.players.get(userId),
          points: points.currency(),
          i: i + 1,
        });
      })
      .join("\n")
      .limit("EmbedDescription");
  }

  generateButtons() {

    const rows = [] as { type: 1, components: any[] }[];

    const buttons = Array(this.buttonsAmount)
      .fill(1)
      .map((_, i) => ({
        type: 2,
        label: `${this.defaultSecondsOfCooldown}`,
        custom_id: i,
        style: ButtonStyle.Primary,
        disabled: true,
      }));

    for (let i = 0; i < buttons.length; i += 5)
      rows.push({ type: 1, components: buttons.slice(i, i + 5) });

    if (rows.length > 5) rows.length = 5;
    return rows.asMessageComponents();
  }

  async reply(
    data: {
      content?: string,
      embeds?: APIEmbed[],
      components?: any[],
      ephemeral?: boolean,
    },
  ): Promise<Message<boolean> | undefined | null | void> {

    if (this.interaction instanceof Message)
      return await this.interaction.reply(data).catch(() => this.cancel());

    if (this.interaction.replied)
      return await this.interaction.followUp(data).catch(() => this.cancel());

    return await this.interaction.reply({
      ...data,
      withResponse: true,
    })
      .then(res => res.resource?.message)
      .catch(() => this.cancel());
  }

  async edit(
    data: {
      content?: string,
      embeds?: APIEmbed[],
      components?: any[],
      ephemeral?: boolean
    },
  ) {
    if (this.message?.editable)
      return await this.message.edit(data).catch(() => this.cancel());

    return await this.channel.send(data).catch(() => this.cancel());
  }
}