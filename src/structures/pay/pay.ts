import { APIUser, ButtonStyle, ComponentType, Guild, Message, Routes, parseEmoji } from "discord.js";
import { PaySchema } from "../../database/models/pay";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import Database from "../../database";
import { TransactionsType } from "../../@types/commands";

export default class Pay {
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

    constructor(data: PaySchema) {
        this.value = data.value!;
        this.payer = data.payer!;
        this.receiver = data.receiver!;
        this.expiresAt = data.expiresAt!;
        this.guildId = data.guildId!;
        this.guildId = data.guildId!;
        this.channelId = data.channelId!;
        this.messageId = data.messageId!;
        this.confirm = data.confirm as any;
    }

    get readyToValidate() {
        return this.confirm.payer && this.confirm.receiver;
    }

    get messageLink() {
        return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.messageId}`;
    }

    set receiverConfirmation(state: boolean) {
        this.confirm.receiver = state;
    }

    set payerConfirmation(state: boolean) {
        this.confirm.payer = state;
    }

    async load(): Promise<boolean> {

        this.guild = await client.guilds.fetch(this.guildId);
        if (
            !this.guild
            || this.expiresAt < new Date()
        ) {
            await this.refund("pay.transactions.unknown");
            return this.delete(false, true);
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.message = await this.guild?.channels.cache.get(this.channelId)?.messages?.fetch(this.messageId).catch(() => null);
        if (!this.message) {
            await this.refund("pay.transactions.unknown");
            return this.delete(false, true);
        }

        if (this.confirm.payer && this.confirm.receiver)
            return this.validate(null);

        this.timeout = setTimeout(() => this.expire(), this.expiresAt.valueOf() - Date.now());
        return true;
    }

    async delete(expired: boolean, noRefund?: boolean): Promise<boolean> {

        this.clearTimeout();

        const deleted = await Database.Pay.deleteOne({ messageId: this.messageId })
            .then(() => true)
            .catch(err => {
                console.log(err);
                return false;
            });

        if (noRefund) return true;

        if (!this.confirm.payer && !this.confirm.receiver)
            await this.refund(expired ? "pay.transactions.expired" : "pay.transactions.cancelled");

        return deleted;
    }

    async expire() {
        await this.delete(true);

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
        if (this.timeout)
            clearTimeout(this.timeout);
        return;
    }

    async validate(message: Message<true> | null) {

        await this.delete(false, true);
        const user = await client.rest.get(Routes.user(this.payer))
            .catch(() => undefined) as APIUser | undefined;

        await Database.editBalance(
            this.receiver,
            {
                createdAt: new Date(),
                keywordTranslate: "pay.transactions.recieved",
                method: "add",
                type: "gain",
                value: this.value,
                userIdentify: `${user?.username || "Unknown"} \`${user?.id || "0"}\``,
            }
        );

        if (message) {

            const locales = await Database.Users.find({ id: { $in: [this.payer, this.receiver] } })
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
            });
        }

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

        payerOrReceiver === "payer"
            ? this.payerConfirmation = true
            : this.receiverConfirmation = true;

        return this;
    }

    async refund(key?: TransactionsType["keywordTranslate"]) {

        if (!this.value) return;

        await Database.editBalance(
            this.payer,
            {
                createdAt: new Date(),
                keywordTranslate: key || "pay.transactions.expired",
                method: "add",
                type: "system",
                value: this.value
            }
        );

        return;
    }
}