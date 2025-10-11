import {
  APIEmbed,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  ComponentType,
  Guild,
  InteractionCollector,
  Message,
  MessageCollector,
  MessageFlags,
  parseEmoji,
  TextChannel,
  User,
} from "discord.js";
import { ChannelsInGame, KeyOfLanguages, LocaleString } from "../../util/constants";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import { CollectorReasonEnd } from "../../@types/commands";
import { mapButtons } from "djs-protofy";
import { env } from "process";

const allowedAboutButtonsLength = new Set<string>();

export default class buttonsGame {

  defaultButtonsAmount = 15;
  maxButtonsAmount = 25;
  minButtonsAmount = 2;
  buttonsAmount = 0;
  defaultSecondsBetweenTheRounds = 5;

  minPlayersAmount = env.MACHINE === "localhost" ? 1 : 2;
  maxPlayersAmount = 250000;

  allPlayers = new Set<string>();
  playersAlive = new Set<string>();
  playersDead = new Set<string>();

  buttonsEnabled = new Set<string>();

  messageCount = 0;
  started: boolean = false;
  finished: boolean = false;
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

  declare messageCollector: MessageCollector | undefined;
  declare clickCollector: InteractionCollector<ButtonInteraction<"cached">> | undefined;

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

      if (
        this.interaction instanceof Message
        && Array.isArray(this.args)
      ) {

        for (const arg of this.args) {
          if (!isNaN(Number(arg)))
            amount = Number(arg);
        }
      };

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

  get embedDescription(): string {

    const players = [
      this.playersAlive.toArray(),
      this.playersDead.toArray(),
    ].flat();

    let description = players
      .slice(0, 20)
      .map(id => `${this.memberEmojiEmbedDescription(id)} <@${id}>`)
      .join("\n");

    if (players.length > 20)
      description += `\n${t("quiz.brands.+players", { players: players.length - 20, locale: this.locale })}`;

    if (this.started)
      return description.limit("EmbedDescription");

    return `${description}\n${t("blackjack.awaiting_players", { e, locale: this.locale })}`.limit("EmbedDescription");
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
              players: this.allPlayers.size >= this.maxPlayersAmount
                ? this.maxPlayersAmount.currency()
                : this.allPlayers.size.currency(),
              maxPlayersAmount: this.maxPlayersAmount.currency(),
            }),
            custom_id: "join",
            emoji: parseEmoji(e.Animated.SaphireDance),
            style: ButtonStyle.Primary,
            disabled: this.allPlayers.size >= this.maxPlayersAmount,
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

          if (!this.buttonsEnabled.has(button.custom_id)) {
            button.style = ButtonStyle.Danger;
            button.emoji = parseEmoji("💀")!;
            button.disabled = true;
          }

          if (this.buttonsEnabled.size <= 1)
            button.style = ButtonStyle.Success;

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
        const disabled = !this.buttonsEnabled.has(`${i++}`);
        this.buttonsEnabled.add(`${i}`);
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
    return await this.initPlayersJoinsCollector();
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
      return await this.interaction.reply(data).catch(() => this.cancel(true));

    if (this.interaction.replied)
      return await this.interaction.followUp(data).catch(() => this.cancel(true));

    return await this.interaction.reply({
      ...data,
      withResponse: true,
    })
      .then(res => res.resource?.message)
      .catch(() => this.cancel(true));
  }

  async cancel(deleteMessage: boolean) {
    ChannelsInGame.delete(this.channelId);
    if (deleteMessage) await this.message?.delete().catch(() => { });
    if (this.messageCollector && "stop" in this.messageCollector)
      this.messageCollector.stop();

    if (this.clickCollector && "stop" in this.clickCollector)
      this.clickCollector.stop();
    return;
  }

  async start(int: ButtonInteraction<"cached">) {

    this.started = true;

    await int.update({
      embeds: this.embed,
      components: mapButtons(this.buttons, button => {
        if (!("custom_id" in button)) return button;
        button.disabled = true;
        button.emoji = parseEmoji(e.Loading)!;
        return button;
      }),
    });

    await sleep(2500);

    if (!allowedAboutButtonsLength.has(int.user.id))
      await int.followUp({
        flags: MessageFlags.Ephemeral,
        content: t("buttonsgame.allowedAboutButtonsLength", { e, locale: int.userLocale }),
      });

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

    await sleep(1500);
    return await this.initCooldown();
  }

  async initCooldown() {
    if (!this.message) return await this.cancel(true);

    await this.initClickCollector();
    let i = Number(this.defaultSecondsBetweenTheRounds);

    while (i > 0) {

      await this.sendWithMessageCounter({
        embeds: this.embed,
        components: mapButtons(this.buttons, button => {
          if (!("custom_id" in button)) return button;

          if (!this.buttonsEnabled.has(button.custom_id)) {
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
        }),
      });

      i--;
      await sleep(1500);

      if (this.playersAlive.size === this.played.size)
        break;
    }

    this.clickCollector?.stop();
    this.clickCollector = undefined;
    await this.eliminateAButton();
    return;
  }

  async eliminateAButton() {

    const buttonToRemove = this.buttonsEnabled.toArray().random();
    this.buttonsEnabled.delete(buttonToRemove);

    const usersToAnnounce = new Set<string>();

    for (const memberId of this.playersAlive)
      if (
        this.numberPlayers[buttonToRemove]?.includes(memberId)
        || !this.played.has(memberId)
      ) {
        this.playersDead.add(memberId);
        this.playersAlive.delete(memberId);
        usersToAnnounce.add(memberId);
      }

    await this.announceEliminated(usersToAnnounce.toArray());

    await this.sendWithMessageCounter({
      embeds: this.embed,
      components: mapButtons(this.buttons, button => {
        if (!("custom_id" in button)) return button;

        button.disabled = true;
        button.emoji = this.buttonsEnabled.has(button.custom_id) ? parseEmoji("🌙")! : parseEmoji("💀")!;
        button.style = this.buttonsEnabled.has(button.custom_id) ? ButtonStyle.Secondary : ButtonStyle.Danger;

        return button;
      }),
    });
    await sleep(2500);

    if (
      this.buttonsEnabled.size <= 1
      || this.playersAlive.size <= 1
    )
      return await this.finish();

    this.played.clear();
    this.numberPlayers = {};
    return await this.initCooldown();
  }

  async finish() {
    this.finished = true;

    await this.sendWithMessageCounter({
      embeds: this.embed,
      components: mapButtons(this.buttons, button => {
        if (!("custom_id" in button)) return button;

        button.disabled = true;

        if (!this.buttonsEnabled.has(button.custom_id)) {
          button.emoji = parseEmoji("💀")!;
          button.style = ButtonStyle.Danger;
          return button;
        }

        if (
          this.numberPlayers[button.custom_id]?.length
        ) {
          button.emoji = parseEmoji("👑")!;
          button.style = ButtonStyle.Success;
          return button;
        }

        button.emoji = parseEmoji("🌙")!;
        button.style = ButtonStyle.Primary;

        return button;
      }),
    });

    return await this.cancel(false);
  }

  memberEmojiEmbedDescription(memberId: string) {

    if (
      this.finished
      && this.playersAlive.has(memberId)
    ) return "👑";

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

    await this.sendWithMessageCounter({
      embeds: this.embed,
      components: this.initialComponents,
    });

    this.initialReplyControl = false;
    return;
  }

  initPlayersJoinsCollector() {
    this.messageCount = 0;
    if (!this.message) return this.cancel(true);
    const collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: () => true,
      time: (1000 * 60) * 2,
    })
      .on("collect", async (int: ButtonInteraction<"cached">) => {

        const { user, customId, member } = int;
        if (!member) return;
        const locale = await user.locale();

        if (customId === "join") {

          if (this.allPlayers.size >= this.maxPlayersAmount)
            return await int.reply({
              content: t("roulette.max_players", { e, locale: locale }),
              flags: [MessageFlags.Ephemeral],
            });

          if (this.allPlayers.has(user.id)) {
            this.playersAlive.delete(user.id);
            this.allPlayers.delete(user.id);
            this.updateInitialEmbed();
            return await int.reply({
              content: t("roulette.you_out", { e, locale }),
              flags: [MessageFlags.Ephemeral],
            });
          }

          this.playersAlive.add(user.id);
          this.allPlayers.add(user.id);
          this.updateInitialEmbed();
          await int.reply({
            content: t("buttonsgame.joined", { e, locale }),
            flags: [MessageFlags.Ephemeral],
          });

          if (this.allPlayers.size >= this.maxPlayersAmount) {
            collector.stop("ignore");
            return await this.start(int);
          }

          return;
        }

        if (customId === "start") {
          if (user.id !== this.executor.id)
            return await int.reply({
              content: t("buttonsgame.you_cannot_start", { e, executor: this.executor.toString(), locale: this.locale }),
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
          this.cancel(true);
          await int.message.delete()?.catch(() => { });
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
            return this.initPlayersJoinsCollector();
          }
          return await this.cancel(false);
        }

        if (["time", "idle", "user", "limit", "channelDelete", "guildDelete"].includes(reason))
          return await this.cancel(false);

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

  async setPlayerClick(int: ButtonInteraction<"cached">) {

    const { user, userLocale: locale, customId } = int;

    if (!this.buttonsEnabled.has(customId))
      return await int.reply({
        flags: MessageFlags.Ephemeral,
        content: t("buttonsgame.button_disabled", { e, locale }),
      });

    if (this.played.has(user.id))
      return await int.reply({
        flags: MessageFlags.Ephemeral,
        content: t("buttonsgame.you_already_played", { e, locale }),
      });

    if (this.playersDead.has(user.id))
      return await int.reply({
        flags: MessageFlags.Ephemeral,
        content: t("buttonsgame.you_already_died", { e, locale }),
      });

    if (!this.numberPlayers[customId]?.length)
      this.numberPlayers[customId] = [];

    this.numberPlayers[customId].push(user.id);
    this.played.add(user.id);

    return await int.reply({
      flags: MessageFlags.Ephemeral,
      content: t("buttonsgame.played", { e, locale }),
    });

  }

  async announceEliminated(usersId: string[]) {
    if (
      !this.channel
      || !this.channel.isSendable()
      || !usersId?.length
    ) return;

    let content = t("buttonsgame.eliminated", {
      e, locale: this.locale,
      users: usersId
        .slice(0, 10)
        .map(userId => `<@${userId}>`)
        .join(", "),
    });

    if (usersId.length > 10)
      content += `\n${t("quiz.brands.+players", { players: usersId.length - 10, locale: this.locale })}`;

    return await this.channel.send({ content: content.limit("MessageContent") }).catch(() => { });
  }

  async initClickCollector() {
    if (!this.message) return await this.cancel(true);

    this.clickCollector = (this.message as Message<true>).createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: () => true,
      time: 1000 * 60,
    })
      .on("collect", int => this.setPlayerClick(int));

    return;

  }

}
