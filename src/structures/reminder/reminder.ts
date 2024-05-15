import { ButtonStyle, Guild, Routes, TextChannel, User, parseEmoji, time } from "discord.js";
import { ReminderSchemaType } from "../../database/schemas/reminder";
import client from "../../saphire";
import Database from "../../database";
import { ReminderManager } from "../../managers";
import { keys } from "../../managers/reminder/functions/watch";
import { ReminderViewerCollectors } from "../../commands/functions/reminder/view";
import { t } from "../../translator";
import { intervalTime } from "../../managers/reminder/manager";
import { e } from "../../util/json";
import { ReminderType } from "../../@types/commands";
import { Types } from "mongoose";
import { deleteAutocompleteCache, setReminderToAutocompleteCache } from "../interaction/autocomplete/reminders";

export default class Reminder {

  declare timeout: 0 | NodeJS.Timeout | undefined;
  declare guild?: Guild | void;
  declare channel?: TextChannel | void;
  declare id: string;
  declare _id: string | undefined | Types.ObjectId;
  declare user: User | undefined;
  declare userId: string;
  declare guildId?: string | void | null;
  declare message: string;
  declare lauchAt: Date;
  declare isAutomatic: boolean;
  declare createdAt: Date;
  declare channelId?: string | null;
  declare alerted: boolean;
  declare sendToDM: boolean;
  declare interval: 0 | 1 | 2 | 3;
  declare messageId?: string | null;
  declare disableComponentsDate?: Date | null;
  declare deleteAt?: Date | null;

  constructor(reminder: ReminderSchemaType | ReminderType) {
    this.timeout = 0;
    this.id = reminder.id;
    this._id = reminder._id;
    this.userId = reminder.userId;
    this.guildId = reminder.guildId;
    this.message = reminder.message;
    this.lauchAt = reminder.lauchAt;
    this.isAutomatic = reminder.isAutomatic || false;
    this.createdAt = reminder.createdAt;
    this.channelId = reminder.channelId;
    this.alerted = reminder.alerted || false;
    this.sendToDM = reminder.sendToDM || false;
    this.interval = (reminder.interval || 0) as 0 | 1 | 2 | 3;
    this.messageId = reminder.messageId;
    this.disableComponentsDate = reminder.disableComponents;
    this.deleteAt = reminder.deleteAt;
  }

  get timeRemaining() {
    return this.lauchAt.valueOf() - Date.now();
  }

  async fetch() {
    return await Database.Reminders.findOne({ id: this.id });
  }

  async load(): Promise<this> {

    await this.clear();

    this.guild = await this.fetchGuild();
    this.channel = await this.fetchChannel();
    this.user = await this.fetchUser();
    if (!this.user) return await this.clear();

    if (
      (
        this.sendToDM || !this.guildId || !this.channelId
      ) && client.shardId !== 0
    ) return await this.clear();

    await this.set();

    if (this.deleteAt) return this.enableDeleting();
    if (this.alerted) {
      this.refresh();
      return this;
    }

    // setTimeout's limit in Node.js
    if (this.timeRemaining > 2147483647)
      return this.validateOver32Bits();

    this.timeout = setTimeout(async () => await this.execute(), this.timeRemaining <= 1000 ? 0 : this.timeRemaining);
    this.refresh();
    return this;
  }

  async set() {

    ReminderManager.cache.set(this.id, this);
    await setReminderToAutocompleteCache(this.userId, this);

    if (typeof this._id !== "string") {
      const data = await this.fetch();
      if (data) {
        this._id = data._id.toString();
        keys.set(this._id, this.id);
      }
    } else keys.set(this._id, this.id);

  }

  validateOver32Bits() {

    // setTimeout's limit in Node.js
    if (this.timeRemaining < 2147483647)
      this.timeout = setTimeout(async () => await this.execute(), this.timeRemaining <= 1000 ? 0 : this.timeRemaining);

    setTimeout(() => this.validateOver32Bits(), 1000 * 60 * 60);
    this.refresh();
    return this;
  }

  refresh() {
    if (!this.id && !this.userId) return;
    for (const [key, collector] of ReminderViewerCollectors)
      if (
        this.userId && key.includes(this.userId)
        || this.id && key.includes(this.id)
      )
        collector.emit("refresh", 1);
    return;
  }

  async execute() {
    return (!this.guildId || !this.channelId || this.sendToDM)
      ? await this.emit_dm()
      : await this.emit();
  }

  async emit() {
    const locale = await this.user?.locale() || "en-US";
    let intervalMessage = "";

    if (this.interval > 0)
      intervalMessage += `\n${t("reminder.emit_again_in", { locale, time: time(new Date(Date.now() + intervalTime[this.interval]), "R") })}`;

    if (this.isAutomatic)
      this.message = t(this.message, locale);

    if (!this.channel)
      return await this.emit_dm();

    return await this.channel.send({
      content: t("reminder.new_notification", { e, locale, data: this, intervalMessage }).limit("MessageContent"),
      components: [1, 2, 3].includes(this.interval) || this.isAutomatic
        ? []
        : [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: t("reminder.snooze", locale),
                emoji: parseEmoji(e.Notification),
                custom_id: JSON.stringify({ c: "rmd", src: "snooze", uid: this.userId }),
                style: ButtonStyle.Primary
              },
              {
                type: 2,
                label: t("reminder.revalidate", locale),
                emoji: parseEmoji("📅"),
                custom_id: JSON.stringify({ c: "rmd", src: "revalidate", uid: this.userId }),
                style: ButtonStyle.Primary
              },
              {
                type: 2,
                label: t("reminder.delete", locale),
                emoji: parseEmoji(e.Trash),
                custom_id: JSON.stringify({ c: "rmd", src: "delete", uid: this.userId }),
                style: ButtonStyle.Danger
              }
            ]
          }
        ].asMessageComponents(),
      allowedMentions: {
        users: [this.userId],
        roles: []
      }
    })
      .then(async message => await this.setAlert(Date.now() + 172800000, message.id))
      .catch(async () => await this.emit_dm());
  }

  async revalide(lauchAt: Date, alerted: boolean) {
    if (!lauchAt) return;
    await this.clear();
    return await Database.Reminders.updateOne(
      { id: this.id },
      {
        $set: { lauchAt, alerted },
        $unset: {
          deleteAt: true,
          messageId: true,
          disableComponents: true
        }
      }
    );
  }

  async setAlert(deleteAt: number, messageId: string) {

    if (this.isAutomatic)
      return await this.delete();

    if (this.interval > 0)
      return await this.revalide(
        new Date(Date.now() + intervalTime[this.interval]),
        false
      );

    await this.clear();
    await Database.Reminders.updateOne(
      { id: this.id },
      {
        $set: {
          Alerted: true,
          deleteAt,
          messageId,
          disableComponents: Date.now() + (1000 * 60 * 10)
        }
      }
    )
      .catch(() => { });
  }

  async emit_dm() {
    const locale = await this.user?.locale() || "en-US";
    let intervalMessage = "";

    if (this.interval > 0)
      intervalMessage += `\n${t("reminder.emit_again_in", { locale, time: time(new Date(Date.now() + intervalTime[this.interval]), "R") })}`;

    if (this.isAutomatic)
      this.message = t(this.message, locale);

    return await client.users.send(
      this.userId,
      { content: t("reminder.new_notification", { e, locale, data: this, intervalMessage }).limit("MessageContent") }
    )
      .then(async () => {

        if ([1, 2, 3].includes(this.interval))
          return await this.revalide(
            new Date(Date.now() + intervalTime[this.interval]),
            false
          );

        return await this.delete();
      })
      .catch(async () => await this.delete());
  }

  async clear() {
    this.stop();
    ReminderManager.cache.delete(this.id);
    deleteAutocompleteCache(this.userId);
    if (typeof this._id === "string") keys.delete(this._id);
    return this;
  }

  stop() {
    clearTimeout(this.timeout);
  }

  enableDeleting() {
    if (this.disableComponentsDate) {
      const timeRemaining = this.disableComponentsDate.valueOf() - Date.now();
      setTimeout(() => this.disableComponents(), timeRemaining <= 0 ? 1 : timeRemaining);
    }

    const deleteRemaining = this.deleteAt!.valueOf() - Date.now();
    setTimeout(() => this.delete(), deleteRemaining <= 0 ? 1 : deleteRemaining);
    this.refresh();
    return this;
  }

  async delete() {
    await this.clear();
    return await Database.Reminders.deleteOne({ id: this.id });
  }

  async fetchUser(): Promise<User> {
    return await client.users.fetch(this.userId);
  }

  async fetchChannel(): Promise<TextChannel | void> {
    if (!this.guild || !this.channelId) return;
    return await this.guild.channels.fetch(this.channelId).catch(() => undefined) as TextChannel;
  }

  async fetchGuild(): Promise<Guild | void> {
    if (!this.guildId) return;
    return await client.guilds.fetch(this.guildId).catch(() => undefined);
  }

  async disableComponents() {
    if (!this?.channelId || !this?.messageId) return;

    return await client.rest.patch(
      Routes.channelMessage(this.channelId, this.messageId),
      { body: { components: [] } }
    ).catch(() => { });

  }

  async snooze(): Promise<boolean> {
    await this.clear();
    return await Database.Reminders.updateOne(
      { id: this.id },
      {
        $set: {
          lauchAt: new Date(Date.now() + (1000 * 60 * 10)),
          alerted: false
        },
        $unset: {
          deleteAt: true,
          disableComponents: true,
          messageId: true
        }
      }
    )
      .then(() => true)
      .catch(() => false);
  }

  async move(guildId: string, channelId: string | undefined): Promise<boolean | Error> {
    if (!guildId || channelId === this.channelId) return false;
    await this.clear();
    return await Database.Reminders.updateOne(
      { id: this.id },
      { $set: { guildId, channelId } }
    )
      .then(() => true)
      .catch(er => er);
  }

}