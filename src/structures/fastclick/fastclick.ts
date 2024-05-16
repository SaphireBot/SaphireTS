import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Guild, LocaleString, Message, TextChannel, User, parseEmoji } from "discord.js";
import { ChannelsInGame } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import { mapButtons } from "djs-protofy";
import { randomInt } from "crypto";

export default class FastClick {

  defaultButtonsAmount = 15;
  defaultPointsAmount = 15;
  defaultSecondsOfCooldown = 3;
  timeToAwaitForTheClick = 5000;
  cooldownCount = 1;
  players = new Collection<string, User>();
  counter = new Map<string, number>();

  declare _locale: LocaleString;
  declare channel: TextChannel;
  declare channelId: string;
  declare guild: Guild;
  declare interaction: ChatInputCommandInteraction<"cached"> | Message<true>;
  declare user: User;
  declare args?: string[];
  declare message?: Message<true>;
  declare buttonsAmount: number;
  declare points: number;

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

    this.points = ((): number => {

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

    if (this._locale) return this.locale;

    if (this.interaction instanceof ChatInputCommandInteraction)
      this._locale = this.interaction.options.getString("locale") as LocaleString | null || this.guild.preferredLocale as LocaleString;

    if (this.interaction instanceof Message)
      this._locale = this.guild.preferredLocale as LocaleString;

    return this._locale;

  }

  async checkBeforeInicialize() {

    if (ChannelsInGame.has(this.channelId))
      return await this.reply({
        content: t("battleroyale.a_party_in_running", { e, locale: this.locale })
      });

    // ChannelsInGame.add(this.channelId);
    return await this.init();
  }

  async init() {

    this.message = await this.reply({
      content: t("fastclick.initing", { e, locale: this.locale }),
      components: this.generateButtons()
    });

    await this.cooldown();

  }

  async cooldown(): Promise<any> {

    await sleep(1300);
    const components = mapButtons(this.message!.components, (button) => {
      button.emoji = undefined;
      button.label = `${this.defaultSecondsOfCooldown - this.cooldownCount}`;
      return button;
    });

    await this.edit({ components });

    this.cooldownCount++;
    if (this.cooldownCount >= this.defaultSecondsOfCooldown) {
      await sleep(1300);
      this.cooldownCount = 1;

      const customId = `${randomInt(this.buttonsAmount - 1)}`;
      const components = mapButtons(this.message!.components, (button) => {
        button.emoji = parseEmoji(e.GrayStar)!;
        button.label = undefined;
        button.style = ButtonStyle.Secondary;
        if ((button as any)?.custom_id === customId) {
          button.emoji = parseEmoji("⭐")!;
          button.style = ButtonStyle.Success;
          button.disabled = false;
        }
        return button;
      });

      await this.edit({ components });
      return;
    }

    return await this.cooldown();
  }

  enableCollector() {
    this.message?.createMessageComponentCollector({
      filter: () => true,
      time: this.timeToAwaitForTheClick,
      max: 1
    })
      .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {
        const { user } = int;
        if (!this.players.has(user.id)) this.players.set(user.id, user);
        this.counter.set(int.user.id, (this.counter.get(user.id) || 0) + 1);

        

      });
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
        disabled: true
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
      fetchReply?: boolean
    }
  ): Promise<Message<true>> {

    data.fetchReply = true;

    if (this.interaction instanceof Message)
      return await this.interaction.reply(data);

    if (this.interaction.replied)
      return await this.interaction.followUp(data);

    data.fetchReply = true;
    return await this.interaction.reply(data) as any;
  }

  async edit(
    data: {
      content?: string,
      embeds?: APIEmbed[],
      components?: any[],
      ephemeral?: boolean
    }
  ) {
    if (this.message?.editable)
      return await this.message.edit(data).catch(() => { });

    return await this.channel.send(data).catch(() => { });
  }
}