import { LocaleString } from "discloud.app";
import { APIEmbed, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, ComponentType, Guild, GuildMember, GuildTextBasedChannel, Message, MessageCollector, parseEmoji, StringSelectMenuInteraction, TextChannel, User, MessageFlags } from "discord.js";
import { ChannelsInGame, KeyOfLanguages } from "../../../util/constants";
import client from "../../../saphire";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { CollectorReasonEnd } from "../../../@types/commands";
import { mapButtons } from "djs-protofy";
import Database from "../../../database";

export default class MemberQuiz {

  rounds = 0;
  messageCounter = 0;
  points: Record<string, number> = {};
  members = new Collection<string, GuildMember>();
  removeBots: boolean = false;

  declare readonly interaction: ChatInputCommandInteraction<"cached"> | Message<true> | StringSelectMenuInteraction<"cached">;
  declare readonly channel: GuildTextBasedChannel;
  declare readonly user: User;
  declare readonly guild: Guild;
  declare actualMember: undefined | GuildMember;
  declare gameStyle: "keyboard" | "buttons" | undefined;
  declare messageCounterCollector: MessageCollector | undefined;
  declare _locale: LocaleString;
  declare message: Message | void | null | undefined;

  constructor(interaction: ChatInputCommandInteraction<"cached"> | Message<true> | StringSelectMenuInteraction<"cached">) {
    this.interaction = interaction;
    this.channel = interaction.channel as TextChannel;
    this.user = interaction instanceof Message ? interaction.author : interaction.user;
    this.guild = interaction.guild;
  }

  get locale(): LocaleString {

    if (this._locale) return this._locale;

    if (
      this.interaction instanceof Message
      || this.interaction instanceof StringSelectMenuInteraction
    ) {
      const content = "message" in this.interaction ? this.interaction.message.content || "" : this.interaction.content || "";
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

  enableMessageCounter() {
    this.messageCounterCollector = this.channel.createMessageCollector({
      idle: (1000 * 60) * 5,
    })
      .on("collect", () => this.messageCounter++);
  }

  async checkIfChannelIsUsed() {

    if (!this.guild) return;

    if (ChannelsInGame.has(this.channel.id)) {
      const content = t("quiz.flags.channel_used", { e, locale: this.locale });

      return this.interaction instanceof Message
        ? await this.interaction.reply({ content })
          .then(msg => setTimeout(() => msg.delete().catch(() => { }), 4000))
        : await this.interaction.reply({
          content,
          ephemeral: true,
        });
    }

    ChannelsInGame.add(this.channel.id);
    return await this.addOrRemoveBots();
  }

  async addOrRemoveBots() {

    if (this.interaction instanceof ChatInputCommandInteraction) {
      const bots = this.interaction.options.getString("bots") as "withbots" | "removeBots" | null;
      if (bots && ["withbots", "removeBots"].includes(bots)) {
        this.removeBots = bots === "removeBots";
        return await this.chooseGameMode();
      }
    }

    await this.sendMessage({
      content: t("quiz_members.addOrRemoveBots", { e, locale: this.locale }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              emoji: parseEmoji("🤖"),
              label: t("quiz_members.components.withBots", { locale: this.locale }),
              custom_id: "keepBots",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: parseEmoji("👥"),
              label: t("quiz_members.components.onlyMembers", { locale: this.locale }),
              custom_id: "removeBots",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: parseEmoji(e.DenyX),
              label: t("keyword_cancel", { locale: this.locale }),
              custom_id: "cancel",
              style: ButtonStyle.Danger,
            },
          ],
        },
      ],
    });

    this.enableMessageCounter();
    return await this.addOrRemoveBotsCollector();
  }

  async addOrRemoveBotsCollector() {

    if (!this.message)
      return await this.finish(t("quiz_members.no_origin_message", { e, locale: this.locale }));

    const collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: int => int.user.id === this.user.id,
      time: (1000 * 60) * 2,
    })
      .on("collect", async (interaction) => {

        const { customId, user, message } = interaction;
        if (user.id !== this.user.id) return;

        if (customId === "cancel")
          return await message.delete().catch(() => { });

        this.removeBots = customId === "removeBots";

        collector.stop();
        await interaction.deferUpdate();
        return await this.chooseGameMode();
      })
      .on("end", async (_, reason: CollectorReasonEnd) => {

        if (reason === "user") return;

        if (["channelDelete", "messageDelete", "guildDelete"].includes(reason))
          return await this.finish();

        if (["idle", "limit", "time", "cancel"].includes(reason))
          return await this.finish(t("quiz_members.game_finished", { e, locale: this.locale }));

      });

    return;
  }

  async chooseGameMode() {

    if (this.interaction instanceof ChatInputCommandInteraction) {
      const gameStyle = this.interaction.options.getString("answers") as "buttons" | "keyboard" | null;
      if (gameStyle && ["buttons", "keyboard"].includes(gameStyle)) {
        this.gameStyle = gameStyle;
        return await this.loadMembersAndStart();
      }
    }

    await this.editMessage({
      content: t("quiz_members.chooseGameMode", { e, locale: this.locale }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              emoji: parseEmoji("⌨️"),
              label: t("quiz_members.components.keyboard", { locale: this.locale }),
              custom_id: "keyboard",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: parseEmoji(e.Commands),
              label: t("quiz_members.components.buttons", { locale: this.locale }),
              custom_id: "buttons",
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              emoji: parseEmoji(e.DenyX),
              label: t("keyword_cancel", { locale: this.locale }),
              custom_id: "cancel",
              style: ButtonStyle.Danger,
            },
          ],
        },
      ],
    });

    return await this.chooseGameModeCollector();
  }

  async chooseGameModeCollector() {

    if (!this.message)
      return await this.finish(t("quiz_members.no_origin_message", { e, locale: this.locale }));

    const collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: int => int.user.id === this.user.id,
      time: (1000 * 60) * 2,
    })
      .on("collect", async (interaction) => {

        const { user, message } = interaction;
        if (user.id !== this.user.id) return;

        const customId = interaction.customId as "keyboard" | "buttons" | "cancel";

        if (customId === "cancel")
          return await message.delete().catch(() => { });

        this.gameStyle = customId;

        collector.stop();
        await interaction.deferUpdate();
        return await this.loadMembersAndStart();
      })
      .on("end", async (_, reason: CollectorReasonEnd) => {

        if (reason === "user") return;

        if (["channelDelete", "messageDelete", "guildDelete"].includes(reason))
          return await this.finish();

        if (["idle", "limit", "time", "cancel"].includes(reason))
          return await this.finish(t("quiz_members.game_finished", { e, locale: this.locale }));

      });

    return;
  }

  async loadMembersAndStart() {

    await this.editMessage({
      content: t("quiz_members.loading_members", { e, locale: this.locale }),
      components: [],
    });
    await sleep(1500);

    const members = await this.guild?.members.fetch().catch(() => null);
    if (!members || !members.size || members.size < 5)
      return await this.finish(t("quiz_members.member_not_found", { e, locale: this.locale }));

    this.members = members.clone();

    if (this.removeBots)
      this.members = this.members.filter(member => !member.user.bot);

    if (this.members.size < 5)
      return await this.finish(t("quiz_members.no_members_enough", { e, locale: this.locale }));

    await this.editMessage({ content: t("quiz_members.members_found_removing_no_photos", { e, locale: this.locale, members: this.members.size }) });

    this.members.filter(member => {
      if (member.displayAvatarURL().includes("https://cdn.discordapp.com/embed/avatars"))
        this.members.delete(member.id);
    });
    await sleep(3000);

    if (this.members.size < 5)
      return await this.finish(t("quiz_members.no_members_enough", { e, locale: this.locale }));

    await this.editMessage({ content: t("quiz_members.loading_details", { e, locale: this.locale, members: this.members.size }) });
    await sleep(3000);

    return await this.startNewRound();
  }

  async startNewRound() {

    if (!this.message)
      return await this.finish(t("quiz_members.no_origin_message", { e, locale: this.locale }));

    const member = this.removeAndSetNewRandomMember();
    if (!member) return await this.end();

    await this.editMessage({
      content: null,
      embeds: this.buildEmbed(),
      components: this.getComponents(),
    });

    return await this.roundCollector();
  }

  async end() {
    await this.finish();
    await this.sendMessage({
      content: null,
      embeds: [{
        color: Colors.Blue,
        title: t("quiz_members.embed.final_title", this.locale),
        description: Object.entries(this.points)
          .sort((a, b) => b[1] - a[1])
          .map(([userId, points], i) => `${i + 1}. ${`<@${userId}>`} ${points} ${t("quiz.flags.points", this.locale)}`)
          .join("\n")
          .limit("EmbedDescription"),
        image: {
          url: client.user!.displayAvatarURL()!,
        },
      }],
    });
  }

  async roundCollector() {

    if (!this.message)
      return await this.finish(t("quiz_members.no_origin_message", { e, locale: this.locale }));

    if (this.gameStyle === "buttons")
      return await this.roundButtonCollector();

    if (this.gameStyle === "keyboard")
      return await this.keyboardButtonCollector();

    console.log(this.gameStyle);
    return await this.finish("No Game Mode Defined");
  }

  async roundButtonCollector() {

    if (!this.message)
      return await this.finish(t("quiz_members.no_origin_message", { e, locale: this.locale }));

    const hasPlayed = new Set<string>();

    const collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: () => true,
      time: 1000 * 30,
    })
      .on("collect", async (int) => {

        if (!this.actualMember) {
          collector.stop();
          return await this.finish(t("quiz_members.unknown_member", { e, locale: this.locale }));
        }

        const { user, customId, message } = int;

        if (customId === this.actualMember.id) {
          collector.stop();
          await this.addPoint(user.id);
          await sleep(500);

          if (!this.points[user.id]) this.points[user.id] = 0;

          this.points[user.id]++;

          const components = mapButtons(message.components, button => {
            if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;

            button.disabled = true;
            if (button.custom_id === customId) button.style = ButtonStyle.Success;
            return button;
          });

          const embed = message.embeds[0].toJSON();
          embed.description = t("quiz_members.embed.description", {
            locale: this.locale,
            member: this.actualMember,
            rank: this.ranking,
            user,
          });

          await int.update({
            embeds: [embed],
            components,
          });

          await sleep(3000);
          return await this.startNewRound();
        }

        if (hasPlayed.has(user.id))
          return await int.reply({
            content: t("quiz_members.hasPlayed", {
              e,
              locale: await int.user.locale(),
            }),
            flags: MessageFlags.Ephemeral,
          });

        if (customId !== this.actualMember.id) {
          hasPlayed.add(user.id);
          return await int.reply({
            content: t("quiz_members.mistake", {
              e,
              locale: await int.user.locale(),
              member: `<@${this.guild.members.cache.get(customId)?.id}>`,
            }),
            flags: MessageFlags.Ephemeral,
          });
        }

      })
      .on("end", async (_, reason: CollectorReasonEnd) => {

        if (reason === "user") return;

        if (["channelDelete", "messageDelete", "guildDelete"].includes(reason))
          return await this.finish();

        if (["idle", "limit", "time"].includes(reason))
          return await this.end();

      });

  }

  async keyboardButtonCollector() {

    if (!this.message)
      return await this.finish(t("quiz_members.no_origin_message", { e, locale: this.locale }));

    const messageCollector = this.channel.createMessageCollector({
      filter: message => !message.author.bot && message.content.length > 1,
      time: 1000 * 30,
    })
      .on("collect", async message => {

        const { author, content } = message;

        if (!this.actualMember) {
          messageCollector.stop();
          return await this.finish(t("quiz_members.unknown_member", { e, locale: this.locale }));
        }

        const response = content.toLowerCase();

        if (
          this.actualMember.displayName.toLowerCase() === response
          || this.actualMember.user.username.toLowerCase() === response
          || this.actualMember.id === response
        ) {
          messageCollector.stop();
          await sleep(500);
          await this.addPoint(author.id);
          await message.react("⭐").catch(() => { });

          if (!this.points[author.id]) this.points[author.id] = 0;

          this.points[author.id]++;

          const components = this.message
            ? mapButtons(this.message!.components, button => {
              if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;

              button.disabled = true;
              return button;
            })
            : [];

          const embed = this.message ? this.message.embeds[0].toJSON() : {};
          embed.description = t("quiz_members.embed.description", {
            locale: this.locale,
            member: this.actualMember,
            rank: this.ranking,
            user: author,
          });

          await this.editMessage({
            content: null,
            embeds: [embed],
            components,
          });

          await sleep(3000);
          return await this.startNewRound();
        }

      })
      .on("end", async (_, reason) => {

        if (reason === "user") return;

        if (["channelDelete", "guildDelete"].includes(reason))
          return await this.finish();

        if (["idle", "limit", "time"].includes(reason))
          return await this.end();

      });

    return;
  }

  get ranking() {
    const entries = Object.entries(this.points);
    let ranking = entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, points], i) => `${i + 1}. ${`<@${userId}>`} ${points} ${t("quiz.flags.points", this.locale)}`)
      .join("\n");

    if (entries.length > 5)
      ranking += `\n${t("quiz.flags.+players", { players: entries.length - 5, locale: this.locale })}`;

    if (!entries.length)
      return "";

    return ranking;
  }

  getComponents() {

    const components = [];

    if (!this.actualMember)
      components.push(
        {
          type: 1,
          components: [{
            type: 2,
            emoji: parseEmoji(e.DenyX),
            label: t("quiz_members.components.no_member", this.locale),
            custom_id: "ignore",
            style: ButtonStyle.Primary,
            disabled: true,
          }] as any[],
        });

    if (this.gameStyle === "buttons") {

      components.push({
        type: 1,
        components: [] as any[],
      });

      const members = this.guild.members.cache
        .random(5)
        .filter(member => member.user.id !== this.actualMember!.id)
        .slice(0, 4);

      members.push(this.actualMember!);

      if (members.length >= 3)
        for (const member of members.shuffle())
          components[0].components.push({
            type: 2,
            label: member.displayName.limit("ButtonLabel"),
            custom_id: member.id,
            style: ButtonStyle.Primary,
          });
      else
        components[0].components.push({
          type: 2,
          emoji: parseEmoji(e.DenyX),
          label: t("quiz_members.components.no_member", this.locale),
          custom_id: "ignore",
          style: ButtonStyle.Primary,
          disabled: true,
        });
    }

    if (components.length > 5) components.length = 5;
    return components;
  }

  removeAndSetNewRandomMember() {
    if (this.actualMember)
      this.members.delete(this.actualMember.id);

    this.actualMember = this.members.random();
    return this.actualMember;
  }

  async sendMessage(data: { content: string | any, embeds?: APIEmbed[], components?: any[] }) {

    if (this.interaction instanceof Message)
      return this.message = await this.interaction.reply(data);

    if (this.interaction instanceof ChatInputCommandInteraction) {
      if (this.interaction.replied) return this.message = await this.interaction.followUp(data);
      return this.message = await this.interaction.reply({ ...data, withResponse: true }).then(res => res.resource?.message);
    }

    if (this.interaction instanceof StringSelectMenuInteraction) {
      if (this.interaction.replied) return this.message = await this.interaction.followUp(data);
      return this.message = await this.interaction.update({ ...data, withResponse: true }).then(res => res.resource?.message);
    }

    return this.message;
  }

  async editMessage(data: { content: string | null, embeds?: APIEmbed[], components?: any[] }) {

    if (!this.message || this.messageCounter >= 5) {
      this.messageCounter = 0;

      if (this.message?.deletable) {
        await this.message?.delete().catch(() => { });
        this.message = undefined;
      }

      return await this.sendMessage(data);
    }

    if (this.message?.editable)
      return await this.message.edit(data)
        .catch(async () => await this.sendMessage(data));

    return await this.sendMessage(data);
  }

  buildEmbed(): APIEmbed[] {

    if (!this.actualMember) return [];

    return [{
      color: Colors.Blue,
      title: t("quiz_members.embed.title", { e, locale: this.locale }),
      // description: t("quiz_members.embed.description", { e, locale: this.locale }),
      image: {
        url: this.actualMember.displayAvatarURL({ size: 2048 }),
      },
      footer: {
        text: t("quiz_members.embed.footer", { locale: this.locale, members: this.members.size }),
      },
    }];
  }

  async finish(text?: string) {

    ChannelsInGame.delete(this.channel.id);
    if (this.messageCounterCollector) this.messageCounterCollector.stop();

    if (text)
      await this.channel.send({ content: text }).catch(() => { });

    if (this.message?.deletable)
      await this.message.delete().catch(() => { });
  }

  async addPoint(userId: string) {
    await Database.Users.updateOne(
      { id: userId },
      { $inc: { "GamingCount.QuizMembers": 1 } },
      { upsert: true },
    );
  }

}