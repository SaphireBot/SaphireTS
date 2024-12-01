import { ChatInputCommandInteraction, GuildTextBasedChannel, Message, LocaleString, Guild, ButtonStyle, parseEmoji, GuildMember, ComponentType, ButtonInteraction } from "discord.js";
import { KeyOfLanguages } from "../../util/constants";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import Database from "../../database";

export default class Tictactoe {

  declare opponent: GuildMember | undefined;
  declare author: GuildMember;
  declare interaction: ChatInputCommandInteraction<"cached"> | Message<true> | ButtonInteraction<"cached">;
  declare channel: GuildTextBasedChannel | null;
  declare guild: Guild;
  declare _locale: LocaleString;
  declare message: Message<true> | null;

  constructor(interaction: ChatInputCommandInteraction<"cached"> | Message<true> | ButtonInteraction<"cached">) {
    this.interaction = interaction;
    this.channel = interaction.channel;
    this.author = interaction.member!;
    this.guild = interaction.guild;

    this.getOpponentAndLauch();
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
        || this.interaction?.userLocale
        || client.defaultLocale
      ) as keyof typeof KeyOfLanguages
    ] as LocaleString;

    if (!KeyOfLanguages[this._locale as keyof typeof KeyOfLanguages])
      this._locale = client.defaultLocale as "pt-BR";

    return this._locale;
  }

  async getOpponentAndLauch() {

    if (this.interaction instanceof ChatInputCommandInteraction)
      this.opponent = this.interaction.options.getMember("opponent")!;

    if (this.interaction instanceof Message) {
      const mentions = await this.interaction.parseMemberMentions();
      this.opponent = mentions.filter(member => (member.id !== this.author.id) || !member.user.bot).first()!;
    }

    if (this.interaction instanceof ButtonInteraction) {
      const parse = JSON.parse(this.interaction.customId) as { c: "tictactoe", id: string, id2: string };
      const userId = parse.id === this.author.id ? parse.id2 : parse.id;
      this.opponent = await this.guild.members.fetch(userId).catch(() => null) as any;
    }

    if (
      this.opponent?.id === this.author.id
      || this.opponent?.user.bot
    ) this.opponent = undefined;

    if (!this.opponent?.id)
      // @ts-expect-error ignore;
      return await this.interaction.reply({
        content: t("tictactoe.no_user_mentioned", {
          e,
          locale: this.locale,
          prefix: (await Database.getPrefix({ guildId: this.guild.id, userId: this.author.id })).random(),
        }),
      });

    return await this.lauch();
  }

  async lauch() {

    // @ts-expect-error ignore;
    this.message = await this.interaction.reply({
      content: t("tictactoe.lauch_message", { e, locale: this.locale, opponent: this.opponent?.toString(), author: this.author?.toString() }),
      fetchReply: true,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("keyword_accept", this.locale),
              custom_id: "accept",
              emoji: parseEmoji("⭕")!,
              style: ButtonStyle.Success,
            },
            {
              type: 2,
              label: t("keyword_refuse", this.locale),
              custom_id: "deny",
              emoji: parseEmoji("✖️")!,
              style: ButtonStyle.Danger,
            },
          ],
        },
      ],
    }).catch(() => null);

    if (!this.message) return;

    return await this.acceptCollector();
  }

  async acceptCollector() {
    if (!this.message) return;

    const collector = this.message.createMessageComponentCollector({
      filter: int => [this.author.id, this.opponent!.id].includes(int.user.id),
      time: (1000 * 60) * 2,
      componentType: ComponentType.Button,
    })
      .on("collect", async int => {

        const { customId, user } = int;

        if (customId === "deny") {
          collector.stop();
          return await this.message?.delete().catch(() => { });
        }

        if (customId === "accept") {
          if (user.id !== this.opponent!.id) {
            const locale = await user.locale();
            return await int.reply({
              content: t("tictactoe.just_opponent_can_accept", { e, locale, opponent: this.opponent?.toString() }),
              ephemeral: true,
            });
          }
          collector.stop();
          return await this.start();
        }

      })
      .on("end", async () => await this.message?.delete().catch(() => { }));

    if (!collector) await this.message?.delete().catch(() => { });
    return;
  }

  async start() {

    const whoWillPlayNow = [this.author.id, this.opponent!.id].random();
    const components: any[] = [];

    let id = 0;
    for (let i = 0; i < 3; i++) {
      components.push({
        type: 1,
        components: Array(3)
          .fill(1)
          .map(() => {
            id++;
            return {
              type: 2,
              custom_id: JSON.stringify({ c: "tictactoe", id: `${id}` }),
              style: ButtonStyle.Secondary,
              emoji: parseEmoji("▪️"),
            };
          }),
      });
    }

    if (!("send" in (this.channel || {})) || !this.channel) return;

    const emoji = {
      [this.author.id]: "⭕",
      [this.opponent!.id]: "❌",
    };

    const message = await this.channel?.send({
      content: t("tictactoe.playNow", { e, locale: this.locale, whoWillPlayNow, emoji: emoji[whoWillPlayNow] }),
      components,
    }).catch(() => { });

    if (!message) return;

    await Database.Games.set(`Tictactoe.${this.guild.id}.${this.channel.id}.${message.id}`, {
      players: [this.author.id, this.opponent!.id],
      opponent: this.opponent!.id,
      author: this.author.id,
      whoPlayNow: whoWillPlayNow,
      emoji,
    });

  }
}