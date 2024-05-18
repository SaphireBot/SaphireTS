import { ButtonStyle, Colors, ComponentType, GuildMember, Message, time } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import Pay from "../../../structures/pay/pay";
import { PayManager } from "../../../managers";
import listPay from "./pay/list";
import client from "../../../saphire";
const aliases = ["pagar", "支払い", "paiement", "pago", "zahlung", "p"];

export default {
    name: "pay",
    description: "Send sapphires to another users",
    aliases,
    category: "economy",
    api_data: {
        category: "economy",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { userLocale: locale, author } = message;

        if (
            [
                "l",
                "list",
                "liste",
                "lista",
                "リスト"
            ].includes(args?.[0]?.toLowerCase() || "")
        ) return listPay(message);

        if ((args?.length || 0) < 2) {
            const prefix = (await Database.getPrefix({ guildId: message.guildId })).random();
            const moviment = ((await Database.Client.findOne({ id: client.user?.id as string }))?.TotalBalanceSended || 0).currency();
            return await message.reply({
                embeds: [{
                    color: Colors.Blue,
                    title: t("pay.embed.title", { e, locale }),
                    description: t("pay.embed.description", { prefix, locale }),
                    fields: [
                        {
                            name: t("pay.embed.fields.0.name", locale),
                            value: t("pay.embed.fields.0.value", { message, locale })
                        },
                        {
                            name: t("pay.embed.fields.1.name", { e, locale }),
                            value: t("pay.embed.fields.1.value", locale)
                        },
                        {
                            name: t("pay.embed.fields.2.name", locale),
                            value: t("pay.embed.fields.2.value", locale)
                        },
                        {
                            name: t("pay.embed.fields.3.name", locale),
                            value: t("pay.embed.fields.3.value", { locale, prefix, message })
                        },
                        {
                            name: t("pay.embed.fields.4.name", locale),
                            value: t("pay.embed.fields.4.value", { locale, prefix })
                        },
                        {
                            name: t("pay.embed.fields.5.name", locale),
                            value: t("pay.embed.fields.5.value", { locale, aliases: aliases.map(str => `\`${str}\``).join(", ") })
                        }
                    ],
                    footer: {
                        text: t("pay.embed.footer.text", { locale, moviment })
                    }
                }]
            });
        }

        const msg = await message.reply({ content: t("pay.loading", { e, locale }) });
        const members = await message.parseMemberMentions();

        if (!members.size)
            return await msg.edit({
                content: t("pay.member_not_found", { e, locale })
            });

        if (members.every(m => m?.user.bot))
            return await msg.edit({ content: t("pay.all_members_is_bot", { e, locale }) });

        for (const [memberId, member] of members) {
            if (!member.user.bot && memberId !== author.id && !client.blacklisted.has(memberId as string))
                continue;
            members.delete(memberId);
        }

        if (!members?.size)
            return await msg.edit({ content: t("pay.no_members_allowed", { e, locale }) });

        let amount: number = 0;

        for (const arg of args!)
            if (arg.length < 10)
                if (!isNaN(arg?.toNumber())) {
                    amount = arg?.toNumber();
                    break;
                }

        if (amount <= 0)
            return await msg.edit({
                content: t("pay.just_above_zero", { e, locale })
            });

        const timeMs = args?.join(" ")?.toDateMS() || (1000 * 60 * 60 * 24);
        const balance = (await Database.getUser(author.id))?.Balance || 0;
        const realBalance = amount * members.size;

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

        for await (const member of members.values())
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
                console.log("ay.err_to_create_payment", payData);
                return await MessageToSave.edit({
                    content: t("pay.err_to_create_payment", {
                        e,
                        locale,
                        error: payData?.error
                    })
                });
            }

            const pay = new Pay(Object.assign(payData, { message: MessageToSave }));
            PayManager.cache.set(MessageToSave.id, pay);
            pay.load();

            await Database.Client.updateOne(
                { id: client.user?.id as string },
                { $inc: { TotalBalanceSended: amount } }
            );

            await Database.editBalance(
                author.id,
                {
                    createdAt: new Date(),
                    keywordTranslate: "pay.transactions.sended",
                    method: "sub",
                    type: "loss",
                    mode: "pay",
                    value: amount,
                    userIdentify: `${member.user.username} \`${member.user.id}\``
                }
            );

            return;

        }

    }

};