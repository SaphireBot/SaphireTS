import { ButtonStyle, ComponentType, GuildMember, Message, time } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import Pay from "../../../structures/pay/pay";
import { PayManager } from "../../../managers";

export default {
    name: "pay",
    description: "Send sapphires to another users",
    aliases: ["pagar", "支払い", "paiement", "pago", "zahlung"],
    category: "economy",
    api_data: {
        category: "economy",
        synonyms: ["pagar", "支払い", "paiement", "pago", "zahlung"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { userLocale: locale, author } = message;

        if ((args?.length || 0) < 2)
            return await message.reply({ content: "invalid_args" });

        const msg = await message.reply({ content: t("pay.loading", { e, locale }) });
        const members = await message.getMultipleMembers();

        if (!members.length)
            return await msg.edit({
                content: t("pay.member_not_found", { e, locale })
            });

        const amount = args?.[0]?.toNumber() || 0;
        const timeMs = args?.join(" ")?.toDateMS() || (1000 * 60 * 60 * 24);
        const balance = (await Database.getUser(author.id))?.Balance || 0;
        const realBalance = amount * members.length;

        if (balance < realBalance)
            return await msg.edit({
                content: t("pay.realBalance_not_enough", {
                    e,
                    locale,
                    value: (realBalance - balance).currency()
                })
                    .limit("MessageContent")
            });

        const date = new Date(Date.now() + timeMs);

        if (
            date.valueOf() < Date.now() + 1000 * 60
            || date.valueOf() > Date.now() + (1000 * 60 * 60 * 24 * 7)
        )
            return await msg.edit({ content: t("pay.invalid_date", { e, locale }) });

        for await (const member of members)
            await save(member);

        return await msg.delete();

        async function save(member?: GuildMember | undefined | null) {
            if (!member) return;

            const memberLocale = await member.user.locale() || "en-US";
            const content = locale === memberLocale
                ? t("pay.pay_confirmation_message", {
                    e,
                    locale,
                    member,
                    user: author,
                    amount: amount.currency(),
                    discordTime: time(date, "R")
                })
                : t("pay.pay_confirmation_message", {
                    e,
                    locale,
                    member,
                    user: author,
                    amount: amount.currency(),
                    discordTime: time(date, "R")
                })
                + "\n"
                + t("pay.pay_confirmation_message", {
                    e,
                    locale: memberLocale,
                    member,
                    user: author,
                    amount: amount.currency(),
                    discordTime: time(date, "R")
                });

            const MessageToSave = await message.reply({
                content,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: ComponentType.Button,
                                label: t("pay.components.confirm", {
                                    confirms: 0,
                                    locale: msg.guild.preferredLocale
                                }),
                                emoji: e.MoneyWings.emoji(),
                                custom_id: JSON.stringify({ c: "pay", src: "accept" }),
                                style: ButtonStyle.Success
                            },
                            {
                                type: ComponentType.Button,
                                label: t("pay.components.cancel", msg.guild.preferredLocale),
                                emoji: e.DenyX.emoji(),
                                custom_id: JSON.stringify({ c: "pay", src: "cancel" }),
                                style: ButtonStyle.Danger
                            }
                        ]
                    }
                ]
            }).catch(() => undefined);

            if (!MessageToSave) return;

            const payData = await new Database.Pay({
                channelId: msg.channelId,
                confirm: {
                    payer: false,
                    receiver: false
                },
                expiresAt: date,
                guildId: msg.guildId,
                messageId: MessageToSave.id,
                payer: author.id,
                receiver: member.id,
                value: amount
            })
                .save()
                .catch((error) => ({ error }));

            if ("error" in payData) {
                console.log(payData);
                return await MessageToSave.edit({
                    content: t("pay.err_to_create_payment", {
                        e,
                        locale,
                        error: payData?.error
                    })
                });
            }

            const pay = new Pay(payData);
            PayManager.cache.set(MessageToSave.id, pay);
            pay.load();

            await Database.editBalance(
                author.id,
                {
                    createdAt: new Date(),
                    keywordTranslate: "pay.transactions.sended",
                    method: "sub",
                    type: "loss",
                    value: amount,
                    userIdentify: `${member.user.username} \`${member.user.id}\``
                }
            );

            return;

        }

    }

};