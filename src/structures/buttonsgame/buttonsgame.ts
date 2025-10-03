import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, ComponentType, Guild, GuildMember, Message, MessageCollector, MessageFlags, parseEmoji, TextChannel, User } from "discord.js";
import { ChannelsInGame, KeyOfLanguages, LocaleString } from "../../util/constants";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import { CollectorReasonEnd } from "../../@types/commands";
import { mapButtons } from "djs-protofy";
import { env } from "process";

const keyTypeOfLang = keyof typeof KeyOfLanguages;

export default class buttonsGame {

  defaultButtonsAmount = 15;
  maxButtonsAmount = 25;
  minButtonsAmount = 2;
  buttonsAmount = 0;
  defaultSecondsBetweenTheRounds = 5;

  minPlayersAmount = 1;
  maxPlayersAmount = "∞";

  allPlayers = new Set<string>();
  playersAlive = new Collection<string, GuildMember>();
  playersDead = new Set<string>();

  buttonsDisabled = new Set<string>();
  buttonsIdToRemove = new Set<string>();

  messageCount = 0;
  started: boolean = false;
  initialReplyControl: boolean = false;
  defaultButtons: any[] = [];

  played = new Set<string>();
  numberPlayers: Record<string, string[]> = {};

  declare _locale: LocaleString;
  declare channel: TextChannel;
  declare channelId: string;
  declare guild: Guild;
  declare interaction: ChatInputCommandInteraction<"cached"> | Message<true>;
  declare executor: User;
  declare args?: string[];
  declare message?: Message<boolean> | undefined | null | void;
  declare messageCollector: MessageCollector;

  constructor(
    interaction: Message<true> | ChatInputCommandInteraction<"cached">,
    args?: string[],
  ) {
    this.channel = interaction.channel as TextChannel;
    this.channelId = interaction.channelId;
    this.guild = interaction.guild;
    this.interaction = interaction;
    this.executor = "user" in interaction ? interaction.user : interaction.author;
    this.args = args;
    this.buttonsAmount = ((): number => {

      let amount = this.defaultButtonsAmount;

      if (this.interaction instanceof ChatInputCommandInteraction)
        amount = this.interaction.options.getInteger("buttons") || amount;

      if (this.interaction instanceof Message)
        amount = Number(this.args?.[0] || amount);

      if (amount < this.minButtonsAmount) amount = this.minButtonsAmount;
      if (amount > this.maxButtonsAmount) amount = this.maxButtonsAmount;
      if (!amount || isNaN(amount)) amount = this.defaultButtonsAmount;

      return amount;
    })();

  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (this.interaction instanceof Message) {
      const content = this.interaction.content || "";
      for (const arg of (content?.split(" ") || []) as string[])
        if (KeyOfLanguages[arg as keyTypeOfLang]) {
          this._locale = KeyOfLanguages[arg as keyTypeOfLang] as LocaleString;
          return this._locale;
        }
    }

    if (this.interaction instanceof ChatInputCommandInteraction) {

      const fromAutocomplete = this.interaction.options.getString("language") as LocaleString;
      if (KeyOfLanguages[fromAutocomplete as keyTypeOfLang]) {
        this._locale = KeyOfLanguages[fromAutocomplete as keyTypeOfLang] as LocaleString;
        return this._locale;
      }

      if (KeyOfLanguages[this.interaction.guild?.preferredLocale as keyTypeOfLang]) {
        this._locale = KeyOfLanguages[this.interaction.guild?.preferredLocale as keyTypeOfLang] as LocaleString;
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
      ) as keyTypeOfLang
    ] as LocaleString;

    if (!KeyOfLanguages[this._locale as keyTypeOfLang])
      this._locale = client.defaultLocale as "pt-BR";

    return this._locale;
  }

  get embedDescription(): string {

    const players = [
      this.playersAlive.keys().toArray(),
      this.playersDead.toArray(),
    ].flat();

    const description = players
      .map(id => `${this.emoji(id)} <@${id}>`)
      .join("\n")
      .limit("EmbedDescription");

    if (this.started)
      return description;

    return `${description}\n${t("blackjack.awaiting_players", { e, locale: this.locale })}`;
  }

  get embed(): APIEmbed[] {
    return [
      {
        color: Colors.Blue,
        title: "❌ Buttons Game ✖️",
        description: this.embedDescription,
        footer: {
          text: `${client.user!.username}'s Game Experience`,
          icon_url: client.user?.displayAvatarURL(),
        },
      },
    ];

  }

  get initialComponents(): any[] {
    return [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("buttonsgame.buttons.start", {
              locale: this.locale,
              players: this.allPlayers.size > this.minPlayersAmount ? this.minPlayersAmount : this.allPlayers.size,
              minPlayersAmount: this.minPlayersAmount,
            }),
            custom_id: "start",
            emoji: parseEmoji("⚔️"),
            style: ButtonStyle.Success,
            disabled: this.allPlayers.size < this.minPlayersAmount,
          },
          {
            type: 2,
            label: t("buttonsgame.buttons.join", {
              locale: this.locale,
              players: this.allPlayers.size, // > this.maxPlayersAmount ? this.maxPlayersAmount : this.players.size,
              maxPlayersAmount: this.maxPlayersAmount,
            }),
            custom_id: "join",
            emoji: parseEmoji(e.Animated.SaphireDance),
            style: ButtonStyle.Primary,
            disabled: false, // this.players.size >= this.maxPlayersAmount,
          },
          {
            type: 2,
            label: t("keyword_cancel", this.locale),
            custom_id: "cancel",
            style: ButtonStyle.Danger,
            emoji: parseEmoji(e.Trash),
          },
        ],
      },
    ];
  }

  get buttons() {

    if (this.defaultButtons.length)
      return mapButtons(
        this.defaultButtons,
        button => {
          if (!("custom_id" in button)) return button;

          if (this.buttonsDisabled.has(button.custom_id)) {
            button.style = ButtonStyle.Danger;
            button.emoji = parseEmoji("💀")!;
            button.disabled = true;
          }

          return button;
        });

    let rows = 0;

    for (let i = 0; i < this.buttonsAmount; i += 5)
      rows++;

    const rawComponents = Array(rows)
      .fill(1)
      .map(() => ({
        type: 1,
        components: [],
      })) as any[];

    let i = 0;
    for (const { components } of rawComponents)
      for (let x = 0; x <= 4; x++) {
        const disabled = this.buttonsDisabled.has(`${i++}`);
        this.buttonsIdToRemove.add(`${i}`);
        components.push({
          type: 2,
          emoji: disabled ? parseEmoji("💀")! : parseEmoji("🌙")!,
          custom_id: `${i}`,
          style: disabled ? ButtonStyle.Danger : ButtonStyle.Secondary,
          disabled,
        });
        if (i >= this.buttonsAmount) break;
      }

    this.defaultButtons = rawComponents.asMessageComponents();
    return this.defaultButtons;
  }

  async checkBeforeInicialize() {

    if (ChannelsInGame.has(this.channelId))
      return await this.reply({
        content: t("battleroyale.a_party_in_running", { e, locale: this.locale }),
      });

    if (env.MACHINE !== "localhost")
      ChannelsInGame.add(this.channelId);
    return await this.init();
  }

  async init() {
    this.message = await this.reply({
      embeds: this.embed,
      components: this.initialComponents,
    });
    this.enableMessageCounter();
    return await this.initialCollector();
  }

  async reply(
    data: {
      content?: string,
      embeds?: APIEmbed[],
      components?: any[],
      ephemeral?: boolean,
    },
  ): Promise<Message<boolean> | undefined | null | void> {

    this.messageCount = 0;

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

  async cancel() {
    ChannelsInGame.delete(this.channelId);
    await this.message?.delete().catch(() => { });
    if (this.messageCollector && "stop" in this.messageCollector)
      this.messageCollector.stop();
    return;
  }

  async start(int: ButtonInteraction<"cached">) {

    this.started = true;

    const buttons = mapButtons(this.buttons, button => {
      if (!("custom_id" in button)) return button;
      button.disabled = true;
      button.emoji = parseEmoji(e.Loading)!;
      return button;
    });

    await int.update({
      components: buttons,
      embeds: this.embed,
    });

    await sleep(2500);

    if (this.messageCount > 5) {
      this.messageCount = 0;
      await this.message?.delete().catch(() => { });
      this.message = undefined;
      return await this.reply({
        components: this.buttons,
        embeds: this.embed,
      });
    }

    this.message = await int.editReply({
      components: this.buttons,
      embeds: this.embed,
    });

    return await this.initCooldown();
  }

  async initCooldown() {
    if (!this.message) return await this.cancel();

    let i = Number(this.defaultSecondsBetweenTheRounds);

    while (i >= 0) {
      const components = mapButtons(this.buttons, button => {
        if (!("custom_id" in button)) return button;

        if (this.buttonsDisabled.has(button.custom_id)) {
          button.label = undefined;
          button.emoji = parseEmoji("💀")!;
          button.disabled = true;
          button.style = ButtonStyle.Danger;
        } else {
          button.label = `${i}`;
          button.emoji = undefined;
          button.disabled = false;
          button.style = ButtonStyle.Secondary;
        }

        return button;
      });

      await this.sendWithMessageCounter({ components, embeds: this.embed });

      i--;
      await sleep(1500);
    }

    await this.eliminateAButton();
  }

  async eliminateAButton() {

    const buttonToRemove = this.buttonsIdToRemove.toArray().random();
    this.buttonsIdToRemove.delete(buttonToRemove);
    this.buttonsDisabled.add(buttonToRemove);

    if (this.numberPlayers[buttonToRemove]?.length)
      for (const memberId of this.numberPlayers[buttonToRemove]) {
        this.playersDead.add(memberId);
        this.playersAlive.delete(memberId);
      }

    for (const memberId of this.playersAlive.keys())
      if (!this.played.has(memberId)) {
        this.playersDead.add(memberId);
        this.playersAlive.delete(memberId);
      }

    this.played.clear();
    const components = mapButtons(this.buttons, button => {
      if (!("custom_id" in button)) return button;

      button.disabled = true;
      button.emoji = this.buttonsDisabled.has(button.custom_id) ? parseEmoji("💀")! : parseEmoji("🌙")!;
      button.style = this.buttonsDisabled.has(button.custom_id) ? ButtonStyle.Danger : ButtonStyle.Secondary;

      return button;
    });

    await this.sendWithMessageCounter({ components, embeds: this.embed });
    await sleep(2500);
    return await this.initCooldown();
  }

  emoji(memberId: string) {
    return this.playersDead.has(memberId) ? "💀" : "👤";
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

  async updateInitialEmbed() {

    if (this.initialReplyControl || this.started) return;

    this.initialReplyControl = true;
    await sleep(2000);
    if (this.started) return;

    if (this.message) {
      this.initialReplyControl = false;

      if (this.messageCount > 3) {
        this.messageCount = 0;
        await this.message.delete().catch(() => { });
        this.message = undefined;
        return;
      }

      return await this.message.edit({
        embeds: this.embed,
        components: this.initialComponents,
      });
    }

    this.initialReplyControl = false;
    this.message = await this.reply({
      embeds: this.embed,
      components: this.initialComponents,
    });
    return;
  }

  initialCollector() {
    this.messageCount = 0;
    if (!this.message) return this.cancel();
    const collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: () => true,
      idle: (1000 * 60) * 2,
    })
      .on("collect", async (int: ButtonInteraction<"cached">) => {

        const { user, customId, member } = int;
        if (!member) return;
        const locale = await user.locale();

        if (customId === "join") {

          // if (this.players.size >= this.maxPlayersAmount)
          //   return await int.reply({
          //     content: t("roulette.max_players", { e, locale: locale }),
          //     flags: [MessageFlags.Ephemeral],
          //   });

          if (this.allPlayers.has(user.id)) {
            this.playersAlive.delete(user.id);
            this.allPlayers.delete(user.id);
            this.updateInitialEmbed();
            return await int.reply({
              content: t("roulette.you_out", { e, locale }),
              flags: [MessageFlags.Ephemeral],
            });
          }

          this.playersAlive.set(user.id, member);
          this.allPlayers.add(user.id);
          this.updateInitialEmbed();
          await int.reply({
            content: t("roulette.you_in", { e, locale }),
            flags: [MessageFlags.Ephemeral],
          });

          // if (this.players.size >= this.maxPlayersAmount) {
          //   collector.stop("ignore");
          //   return await this.start(int);
          // }

          return;
        }

        if (customId === "start") {
          if (user.id !== this.executor.id)
            return await int.reply({
              content: t("roulette.you_cannot_start", { e, executor: this.executor.toString(), locale: this.locale }),
              flags: [MessageFlags.Ephemeral],
            });
          collector.stop("ignore");
          return await this.start(int);
        }

        if (customId === "cancel") {

          if (user.id !== this.executor.id)
            return await int.reply({
              content: t("roulette.you_cannot_cancel", { e, executor: this.executor.toString(), locale: this.locale }),
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
              embeds: this.embed,
              components: this.initialComponents,
            });
            return this.initialCollector();
          }
          return await this.cancel();
        }

        if (["time", "idle", "user", "limit", "channelDelete", "guildDelete"].includes(reason))
          return await this.cancel();

      });

    return;
  }

  async sendWithMessageCounter(data: { components: any[], embeds?: APIEmbed[] }) {

    if (this.messageCount > 5) {
      this.messageCount = 0;
      await this.message?.delete().catch(() => { });
      this.message = undefined;
      await this.reply(data);
    } else
      await this.message?.edit(data)
        .catch(async () => await this.reply(data));

  }

}
