import { Message, Guild, GuildTextBasedChannel } from "discord.js";
import { JokempoSchema } from "../../database/models/jokempo";
import client from "../../saphire";
import Database from "../../database";
import { Types } from "mongoose";
import { JokempoManager } from "../../managers";

export default class Jokempo {
    declare message: Message<true> | undefined;
    declare channel: GuildTextBasedChannel | null | undefined;
    declare guild: Guild | undefined;
    declare timeout: NodeJS.Timeout;
    declare readonly channelId: string;
    declare readonly messageId: string;
    declare readonly guildId: string;
    declare readonly createdBy: string;
    declare readonly opponentId: string;
    declare readonly value: number;
    declare readonly expiresAt: Date;
    declare readonly clicks: Record<string, "stone" | "paper" | "scissors" | undefined>;
    declare readonly ObjectId: Types.ObjectId;

    constructor(data: JokempoSchema) {
        this.ObjectId = data._id;
        this.messageId = data.messageId!;
        this.guildId = data.guildId!;
        this.channelId = data.channelId!;
        this.opponentId = data.opponentId!;
        this.createdBy = data.createdBy!;
        this.value = data.value || 0;
        this.expiresAt = data.expiresAt!;
        this.clicks = {
            [data.createdBy!]: data.clicks[data.createdBy!],
            [data.opponentId!]: data.clicks[data.opponentId!],
        };
    }

    async load(): Promise<this | void> {

        if (!this.messageId) return await this.delete();

        if (this.expiresAt < new Date())
            return await this.delete();

        this.guild = client.guilds.cache.get(this.guildId);
        this.channel = await this.guild?.channels.fetch(this.channelId).catch(() => null) as GuildTextBasedChannel;
        if (!this.channel) return await this.delete();

        this.message = await this.channel.messages?.fetch(this.messageId).catch(() => undefined);
        if (!this.message) return await this.delete();

        JokempoManager.cache.set(this.messageId, this);
        this.timeout = setTimeout(() => this.delete(), this.expiresAt.valueOf() - Date.now());
        return this;
    }

    async delete(isFinish?: boolean) {

        if (this.timeout) clearTimeout(this.timeout);

        if (isFinish) {
            JokempoManager.cache.delete(this.messageId);
            await Database.Jokempo.deleteOne({ messageId: this.messageId });
            return;
        }

        if ((this.value || 0) > 0) this.refund();

        JokempoManager.cache.delete(this.messageId);
        await Database.Jokempo.deleteOne({ messageId: this.messageId });
        if (this.message?.deletable)
            this.message?.delete()?.catch(() => { });
        return;
    }

    isPlayer(userId: string) {
        return [this.createdBy, this.opponentId].includes(userId);
    }

    async getAuthor() {
        return this.guild?.members.fetch(this.createdBy).catch(() => undefined);
    }

    async getOpponent() {
        return this.guild?.members.fetch(this.opponentId).catch(() => undefined);
    }

    async refund() {
        if (!this.value) return;

        // TODO: Make Transaction

    }

}