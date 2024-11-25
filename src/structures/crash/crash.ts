import { ButtonStyle, Message, APIEmbed, Colors, ButtonInteraction } from "discord.js";
import { CrashGameData } from "../../@types/commands";
import Database from "../../database";
import { CrashManager } from "../../managers";
import { t } from "../../translator";
import { e } from "../../util/json";

export default class Crash {
    declare readonly messageId: string;
    declare readonly channelId: string;
    declare readonly guildId: string;
    declare readonly value: number;
    private declare _prize: number;
    private declare index: number;
    private declare editing: boolean;
    private declare message: Message<true>;
    private declare iniciated: boolean;
    private declare crashNumber: number;
    private taked = new Map<string, { value: number, multiplier: string }>();
    private multipliers = ["0.0", "0.0", "0.0", "0.3", "0.5", "0.7", "1.0", "1.3", "1.5", "1.7", "1.9", "2.2", "2.5", "2.7", "3.0", "3.3", "3.6", "4.0", "4.5", "5.0"];
    players = new Set<string>();

    constructor(data: CrashGameData) {
        this.messageId = data.message.id;
        this.channelId = data.channelId;
        this.guildId = data.guildId;
        this.index = -1;
        this.message = data.message;
        this.value = data.value;
        this.crashNumber = this.probability;
    }

    async load() {
        CrashManager.cache.set(this.messageId, this);
        this.prize = 0;

        await Database.Crash.create({
            channelId: this.channelId,
            guildId: this.guildId,
            messageId: this.messageId,
            players: [],
            value: this.value,
        });

        return setTimeout(() => this.checkBeforeInitAndCreateEmbed(), 14500);
    }

    private async checkBeforeInitAndCreateEmbed() {

        if (!this.players.size) {
            await this.message.edit({
                content: t("crash.nobody_join", { e, locale: this.message.guild.preferredLocale }),
                components: [], embeds: [],
            });
            return this.delete();
        }

        const embed: APIEmbed = {
            color: Colors.Blue,
            title: t("crash.embed.title", { e, locale: this.message.guild.preferredLocale }),
            fields: [
                {
                    name: t("crash.embed.fields.0.name", { locale: this.message.guild.preferredLocale }),
                    value: t("crash.embed.fields.0.value", { locale: this.message.guild.preferredLocale, value: this.value?.currency(), crash: this }),
                },
            ],
        };

        this.iniciated = true;
        await this.message.edit({ embeds: [embed], content: null, components: this.components });
        return setTimeout(async () => await this.init(), 3000);
    }

    private async init() {

        const embed: APIEmbed = this.message.embeds[0]?.toJSON() || {
            color: Colors.Blue,
            title: t("crash.embed.title", { e, locale: this.message.guild.preferredLocale }),
            fields: [
                {
                    name: t("crash.embed.fields.0.name", { locale: this.message.guild.preferredLocale }),
                    value: t("crash.embed.fields.0.value", { locale: this.message.guild.preferredLocale, value: this.value?.currency(), crash: this }),
                },
            ],
        };

        embed.description = "";
        for (const data of this.taked)
            embed.description += "\n" + t("crash.embed.description", { id: data[0], value: data[1].value?.currency(), multiplier: data[1]?.multiplier, locale: this.message.guild.preferredLocale });
        embed.description = embed.description.limit("EmbedDescription");

        this.index++;

        if (
            this.crashNumber === 0
            || this.index >= this.crashNumber
            || this.index > 20
        ) {
            this.index = this.crashNumber;
            return await this.crash(embed);
        }

        this.prize = this.index;
        await this.message.edit({
            embeds: [embed],
            components: this.components,
        });
        setTimeout(async () => await this.init(), 2700);
        return;
    }

    private async crash(embed: APIEmbed) {
        this.players.clear();
        CrashManager.cache.delete(this.messageId);
        embed.color = Colors.Red;
        this.delete();
        return await this.message.edit({
            embeds: [embed],
            components: this.components,
        });
    }

    async addPlayer(userId: string, message: Message<true>): Promise<"crash.joined" | "crash.you_already_in"> {
        if (this.players.has(userId)) return "crash.you_already_in";
        this.players.add(userId);
        this.pushPlayer(userId);

        if (!this.editing) {
            this.editing = true;
            setTimeout(async () => {
                await message.edit({ components: this.components });
                this.editing = false;
            }, 2500);
        }

        return "crash.joined";
    }

    set prize(index: number) {
        this._prize = Number(
            parseInt(
                (this.value * Number((this.multipliers[index] || "0.3"))).toFixed(0),
            ),
        );

        if (Number(this.multipliers[index]) > 0)
            this._prize += this.value;
        return;
    }

    get prize() {
        return this._prize;
    }

    async take(interaction: ButtonInteraction<"cached">) {
        const { user, userLocale: locale } = interaction;

        if (!this.players.has(user.id))
            return await interaction.reply({
                content: t("crash.you_are_not_in", { e, locale }),
                ephemeral: true,
            });

        this.pullPlayer(user.id);
        this.players.delete(user.id);
        this.taked.set(user.id, { value: this.prize, multiplier: this.multipliers[this.index] });

        Database.editBalance(
            user.id,
            {
                createdAt: new Date(),
                keywordTranslate: "crash.transactions.taked",
                method: "add",
                mode: "crash",
                type: "gain",
                value: this.prize,
            },
        );

        await interaction.reply({
            content: t("crash.you_taked_successfully", { e, locale, prize: this.prize.currency() }),
            ephemeral: true,
        });

        return;
    }

    async delete() {
        return await Database.Crash.deleteOne({ messageId: this.messageId });
    }

    async bulkRefund() {
        for (const userId of this.players)
            Database.editBalance(
                userId,
                {
                    createdAt: new Date(),
                    keywordTranslate: "crash.transactions.refund",
                    method: "add",
                    mode: "system",
                    type: "system",
                    value: this.value,
                },
            );
        return this.delete();
    }

    private async pullPlayer(userId: string): Promise<void> {
        await Database.Crash.updateOne(
            { messageId: this.messageId },
            { $pull: { players: userId } },
        );
    }

    private async pushPlayer(userId: string): Promise<void> {

        await Database.editBalance(
            userId,
            {
                createdAt: new Date(),
                keywordTranslate: "crash.transactions.beted",
                method: "sub",
                mode: "crash",
                type: "loss",
                value: this.value,
            },
        );

        await Database.Crash.updateOne(
            { messageId: this.messageId },
            { $addToSet: { players: userId } },
        );
        return;
    }

    private style(num: number) {
        if (this.index < 0) return ButtonStyle.Secondary;
        return this.index >= num && num !== this.crashNumber
            ? ButtonStyle.Success
            : this.index === this.crashNumber
                ? ButtonStyle.Danger
                : ButtonStyle.Secondary;
    }

    get components() {
        return [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "0.0",
                        custom_id: "disabled1",
                        style: this.style(0),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "0.0",
                        custom_id: "disabled2",
                        style: this.style(1),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "0.0",
                        custom_id: "disabled3",
                        style: this.style(2),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "0.3x",
                        custom_id: "0.3",
                        style: this.style(3),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "0.5x",
                        custom_id: "0.5",
                        style: this.style(4),
                        disabled: true,
                    },
                ],
            },
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "0.7",
                        custom_id: "0.7",
                        style: this.style(5),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "1.0x",
                        custom_id: "1.0",
                        style: this.style(6),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "1.3x",
                        custom_id: "1.3",
                        style: this.style(7),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "1.5x",
                        custom_id: "1.5",
                        style: this.style(8),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "1.7x",
                        custom_id: "1.7",
                        style: this.style(9),
                        disabled: true,
                    },
                ],
            },
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "1.9x",
                        custom_id: "1.9",
                        style: this.style(10),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "2.2x",
                        custom_id: "2.2",
                        style: this.style(11),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "2.5x",
                        custom_id: "2.5",
                        style: this.style(12),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "2.7x",
                        custom_id: "2.7",
                        style: this.style(13),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "3.0x",
                        custom_id: "3.0",
                        style: this.style(14),
                        disabled: true,
                    },
                ],
            },
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "3.3x",
                        custom_id: "3.3",
                        style: this.style(15),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "3.6x",
                        custom_id: "3.6",
                        style: this.style(16),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "4.0x",
                        custom_id: "4.0",
                        style: this.style(17),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "4.5x",
                        custom_id: "4.5",
                        style: this.style(18),
                        disabled: true,
                    },
                    {
                        type: 2,
                        label: "5.0x",
                        custom_id: "5.0",
                        style: this.style(19),
                        disabled: true,
                    },
                ],
            },
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: "👥",
                        label: t("crash.components.join", { locale: this.message.guild.preferredLocale, crash: this }),
                        custom_id: JSON.stringify({ c: "crash", src: "join" }),
                        style: ButtonStyle.Primary,
                        disabled: this.iniciated,
                    },
                    {
                        type: 2,
                        emoji: e.MoneyWings,
                        label: t("crash.components.take", { locale: this.message.guild.preferredLocale, crash: this }),
                        custom_id: JSON.stringify({ c: "crash", src: "take" }),
                        style: ButtonStyle.Success,
                        disabled: this.index <= 2 || this.index >= this.crashNumber,
                    },
                ],
            },
        ].asMessageComponents();
    }

    private get probability() {
        return Math.random() < 0.7 ? Math.floor(Math.random() * 7) : Math.floor(Math.random() * 15) + 7;
    }

}