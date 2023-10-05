import { time, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, ComponentType, ButtonStyle } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import Pay from "../../../structures/pay/pay";
import { PayManager } from "../../../managers";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
    data: {
        type: ApplicationCommandType.ChatInput,
        application_id: client.user?.id,
        guild_id: "",
        name: "pay",
        name_localizations: getLocalizations("pay.name"),
        description: "[economy] Send Sapphires to another user",
        description_localizations: getLocalizations("pay.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "user",
                name_localizations: getLocalizations("pay.options.0.name"),
                description: "Who do you want to send the Sapphires to?",
                description_localizations: getLocalizations("pay.options.0.description"),
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: "amount",
                name_localizations: getLocalizations("pay.options.1.name"),
                description: "How much Sapphires do you want send?",
                description_localizations: getLocalizations("pay.options.1.description"),
                min_value: 1,
                type: ApplicationCommandOptionType.Integer,
                required: true
            },
            {
                name: "time",
                name_localizations: getLocalizations("pay.options.2.name"),
                description: "How long should the payment be active? (default: 24h) (1m~7d)",
                description_localizations: getLocalizations("pay.options.2.description"),
                type: ApplicationCommandOptionType.String,
                autocomplete: true
            }
        ]
    },
    additional: {
        category: "Economia",
        admin: false,
        staff: false,
        // building: true,
        api_data: {
            name: "pay",
            description: "Envia Safiras para outra pessoa",
            category: "Economia",
            synonyms: [""],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { options, locale, user } = interaction;
            const member = options.getMember("user");
            const amount = options.getInteger("amount") || 0;
            const timeMs = options.getString("time")?.toDateMS();

            if (!member)
                return await interaction.reply({
                    content: t("pay.member_not_found", { e, locale })
                });

            if (member.user?.bot)
                return await interaction.reply({
                    content: t("pay.no_bot", { e, locale, user: member.user })
                });

            const message = await interaction.reply({ content: t("pay.loading", { e, locale }), fetchReply: true });

            const balance = (await Database.getUser(user.id))?.Balance || 0;

            if (balance <= 0 || balance < amount)
                return await interaction.editReply({
                    content: t("pay.balance_not_enough", { e, locale })
                });

            const date = timeMs
                ? new Date(Date.now() + timeMs)
                : (() => {
                    const date = new Date();
                    date.setDate(date.getHours() + 24);
                    return date;
                })();

            if (
                date.valueOf() < Date.now() + 1000 * 60
                || date.valueOf() > Date.now() + (1000 * 60 * 60 * 24 * 7)
            )
                return await interaction.editReply({ content: t("pay.invalid_date", { e, locale }) });

            return new Database.Pay({
                channelId: interaction.channelId,
                confirm: {
                    payer: false,
                    receiver: false
                },
                expiresAt: date,
                guildId: interaction.guildId,
                messageId: message.id,
                payer: user.id,
                receiver: member.id,
                value: amount
            })
                .save()
                .then(async payData => {

                    const pay = new Pay(payData);
                    PayManager.cache.set(message.id, pay);
                    pay.load();


                    await Database.editBalance(
                        user.id,
                        {
                            createdAt: new Date(),
                            keywordTranslate: "pay.transactions.sended",
                            method: "sub",
                            type: "loss",
                            value: amount,
                            userIdentify: `${member.user.username} \`${member.user.id}\``
                        }
                    );

                    const memberLocale = await member.user.locale() || "en-US";
                    const content = locale === memberLocale
                        ? t("pay.pay_confirmation_message", {
                            e,
                            locale,
                            member,
                            user,
                            amount: amount.currency(),
                            discordTime: time(date, "R")
                        })
                        : t("pay.pay_confirmation_message", {
                            e,
                            locale,
                            member,
                            user,
                            amount: amount.currency(),
                            discordTime: time(date, "R")
                        })
                        + "\n"
                        + t("pay.pay_confirmation_message", {
                            e,
                            locale: memberLocale,
                            member,
                            user,
                            amount: amount.currency(),
                            discordTime: time(date, "R")
                        });

                    return await interaction.editReply({
                        content,
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: ComponentType.Button,
                                        label: t("pay.components.confirm", {
                                            confirms: 0,
                                            locale: interaction.guild.preferredLocale
                                        }),
                                        emoji: e.MoneyWings.emoji(),
                                        custom_id: JSON.stringify({ c: "pay", src: "accept" }),
                                        style: ButtonStyle.Success
                                    },
                                    {
                                        type: ComponentType.Button,
                                        label: t("pay.components.cancel", interaction.guild.preferredLocale),
                                        emoji: e.DenyX.emoji(),
                                        custom_id: JSON.stringify({ c: "pay", src: "cancel" }),
                                        style: ButtonStyle.Danger
                                    }
                                ]
                            }
                        ]
                    });
                })
                .catch(async error => {
                    console.log(error);
                    return await interaction.editReply({
                        content: t("pay.err_to_create_payment", {
                            e,
                            locale,
                            error
                        })
                    });
                });
        }
    }
};