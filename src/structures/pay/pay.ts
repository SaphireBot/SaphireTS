import { APIUser, ButtonStyle, ComponentType, Guild, Message, Routes, parseEmoji } from "discord.js";
import { PaySchemaType } from "../../database/schemas/pay";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import Database from "../../database";
import { TransactionsType } from "../../@types/commands";
type refundKey = TransactionsType["keywordTranslate"] | "ignore";

export default class Pay {

    declare refundKey: refundKey | undefined;
    declare _id: string;
    declare readonly value: number;
    declare readonly payer: string;
    declare readonly receiver: string;
    declare readonly expiresAt: Date;
    declare readonly guildId: string;
    declare guild: Guild | null | undefined;
    declare message: Message | null | undefined;
    declare readonly channelId: string;
    declare readonly messageId: string;
    declare timeout: NodeJS.Timeout;
    declare confirm: Record<"payer" | "receiver", boolean>;

    constructor(data: PaySchemaType) {
        this.value = data.value!;
        this.payer = data.payer!;
        this.receiver = data.receiver!;
        this.expiresAt = data.expiresAt!;
        this.guildId = data.guildId!;
        this.guildId = data.guildId!;
        this.channelId = data.channelId!;
        this.messageId = data.messageId!;
        this.confirm = data.confirm as any;
        this._id = data._id.toString();
    }

    get readyToValidate() {
        return this.confirm.payer && this.confirm.receiver;
    }

    get messageLink() {
        return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.messageId}`;
    }

    async load(): Promise<boolean> {

        this.guild = await client.guilds.fetch(this.guildId)?.catch(() => null);
        if (
            !this.guild
            || this.expiresAt < new Date()
        ) return await this.delete("pay.transactions.unknown");

        const payer = await this.guild.members.fetch(this.payer).catch(() => null);
        const receiver = await this.guild.members.fetch(this.receiver).catch(() => null);
        if (!payer && !receiver) return await this.delete("pay.transactions.unknown");

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.message = await this.guild?.channels.cache.get(this.channelId)?.messages?.fetch(this.messageId).catch(() => undefined);
        if (!this.message) return await this.delete("pay.transactions.unknown");

        if (this.confirm.payer && this.confirm.receiver)
            return await this.validate(this.message as Message<true>);

        this.timeout = setTimeout(async () => await this.expire(), this.expiresAt.valueOf() - Date.now());
        return true;
    }

    async delete(key: refundKey): Promise<boolean> {
        this.refundKey = key === "ignore" ? undefined : key;
        return await Database.Pay.deleteOne({ messageId: this.messageId })
            .then(() => this.clearTimeout())
            .catch(() => false);
    }

    async expire() {
        await this.delete("pay.transactions.expired");
        await client.rest.patch(
            Routes.channelMessage(this.channelId, this.messageId),
            {
                body: {
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    label: t("pay.components.expired", this.guild?.preferredLocale),
                                    emoji: parseEmoji(e.Animated.SaphireCry),
                                    custom_id: "disabled",
                                    disabled: true,
                                    style: ButtonStyle.Danger
                                },
                                {
                                    type: ComponentType.Button,
                                    label: t("pay.components.cancel", this.guild?.preferredLocale),
                                    emoji: parseEmoji(e.DenyX),
                                    custom_id: "disabled_",
                                    style: ButtonStyle.Danger,
                                    disabled: true
                                }
                            ]
                        }
                    ]
                }
            }
        )
            .catch(console.error);
    }

    clearTimeout() {
        if (this.timeout) clearTimeout(this.timeout);
        return true;
    }

    async validate(message: Message<true> | null) {

        const user = await client.rest.get(Routes.user(this.payer))
            .catch(() => undefined) as APIUser | undefined;

        await Database.Client.updateOne(
            { id: client.user?.id as string },
            { $inc: { TotalBalanceSended: this.value } }
        );

        await Database.editBalance(
            this.receiver,
            {
                createdAt: new Date(),
                keywordTranslate: "pay.transactions.recieved",
                method: "add",
                type: "gain",
                mode: "pay",
                value: this.value,
                userIdentify: `${user?.username || "Unknown"} \`${user?.id || "0"}\``,
            }
        );

        if (message) {

            const locales = await Database.getUsers([this.payer, this.receiver])
                .then(docs => docs.map(v => v?.locale))
                .catch(() => []);

            let content = "";
            if (locales[0] === locales[1])
                content += t("pay.success", { e, locale: locales[0], this: this, value: this.value.currency() });
            else content += t("pay.success", { e, locale: locales[0], this: this, value: this.value.currency() })
                + "\n"
                + t("pay.success", { e, locale: locales[1], this: this, value: this.value.currency() });

            await message.edit({
                content,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: ComponentType.Button,
                                label: t("pay.components.complete", message.guild.preferredLocale),
                                emoji: e.CheckV.emoji(),
                                custom_id: "disabled",
                                disabled: true,
                                style: ButtonStyle.Success
                            },
                            {
                                type: ComponentType.Button,
                                label: t("pay.components.cancel", message.guild.preferredLocale),
                                emoji: e.DenyX.emoji(),
                                custom_id: "disabled_",
                                style: ButtonStyle.Danger,
                                disabled: true
                            }
                        ]
                    }
                ]
            }).catch(() => { });
        }

        await this.delete("ignore");
        return true;
    }

    isParticipant(userId: string) {
        return [this.payer, this.receiver].includes(userId);
    }

    async validateConfirmation(userId: string) {
        const payerOrReceiver = this.payer === userId ? "payer" : "receiver";

        await Database.Pay.updateOne(
            { id: this.messageId },
            {
                $set: {
                    [`confirm.${payerOrReceiver}`]: true
                }
            }
        );

        this.confirm[payerOrReceiver] = true;
        return this;
    }

    async refund(key?: refundKey) {

        await Database.Client.updateOne(
            { id: client.user?.id as string },
            { $inc: { TotalBalanceSended: this.value } }
        );

        if (!this.value || key === "ignore") return;
        await Database.editBalance(
            this.payer,
            {
                createdAt: new Date(),
                keywordTranslate: key || "pay.transactions.unknown",
                method: "add",
                type: "system",
                mode: "system",
                value: this.value
            }
        );

        return;
    }
}