import { time, MessageFlags, GuildMember, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, ComponentType, ButtonStyle } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import Pay from "../../../structures/pay/pay";
import { PayManager } from "../../../managers";
import listPay from "../../prefix/economy/pay/list";

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
                name: "send",
                name_localizations: getLocalizations("pay.send"),
                description: "[economy] Send Sapphires to another user",
                description_localizations: getLocalizations("pay.description"),
                type: 1,
                options: [
                    {
                        name: "user",
                        name_localizations: getLocalizations("pay.options.0.name"),
                        description: "Who do you want to send the Sapphires to?",
                        description_localizations: getLocalizations("pay.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: "amount",
                        name_localizations: getLocalizations("pay.options.1.name"),
                        description: "How much Sapphires do you want send?",
                        description_localizations: getLocalizations("pay.options.1.description"),
                        min_value: 1,
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        autocomplete: true,
                    },
                    {
                        name: "time",
                        name_localizations: getLocalizations("pay.options.2.name"),
                        description: "How long should the payment be active? (default: 24h) (1m~7d)",
                        description_localizations: getLocalizations("pay.options.2.description"),
                        type: ApplicationCommandOptionType.String,
                        autocomplete: true,
                    },
                ],
            },
            {
                name: "list",
                name_localizations: getLocalizations("pay.list_name"),
                description: "[economy] Check out a list with all pendent payments",
                description_localizations: getLocalizations("pay.list_description"),
                type: 1,
            },
        ],
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
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("pay.name") || {},
                    ),
                ),
            ),
            tags: [],
            perms: {
                user: [],
                bot: [],
            },
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { options, locale, user, guild, channel } = interaction;

            if (options.getSubcommand() === "list") return listPay(interaction);

            const query = options.getString("user") || "";

            await interaction.reply({ content: t("pay.loading", { e, locale }), flags: [MessageFlags.Ephemeral] });

            const queries = query.match(/\d{17,}/g) || [];
            const members = await guild.members.fetch({ user: queries })
                ?.then(d => d.toJSON()?.filter(m => !m?.user?.bot))
                .catch(() => []);

            if (!members.length)
                return await interaction.editReply({
                    content: t("pay.member_not_found", { e, locale }),
                });

            const amount = options.getInteger("amount") || 0;
            if (amount <= 0)
                return await interaction.editReply({
                    content: t("pay.just_above_zero", { e, locale }),
                });

            const timeMs = options.getString("time")?.toDateMS() || (1000 * 60 * 60 * 24);
            const balance = (await Database.getUser(user.id))?.Balance || 0;
            const realBalance = amount * members.length;

            if (balance < realBalance)
                return await interaction.editReply({
                    content: t("pay.realBalance_not_enough", {
                        e,
                        locale,
                        value: (realBalance - balance).currency(),
                    })
                        .limit("MessageContent"),
                });

            const date = new Date(Date.now() + timeMs);

            if (
                date.valueOf() < Date.now() + 1000 * 60
                || date.valueOf() > Date.now() + (1000 * 60 * 60 * 24 * 7)
            )
                return await interaction.editReply({ content: t("pay.invalid_date", { e, locale }) });

            for await (const member of members)
                await save(member);

            return await interaction.editReply({
                content: t("pay.lauch_success", { e, locale }),
            });

            async function save(member: GuildMember) {

                const memberLocale = await member.user.locale() || "en-US";
                const content = locale === memberLocale
                    ? t("pay.pay_confirmation_message", {
                        e,
                        locale,
                        member,
                        user,
                        amount: amount.currency(),
                        discordTime: time(date, "R"),
                    })
                    : t("pay.pay_confirmation_message", {
                        e,
                        locale,
                        member,
                        user,
                        amount: amount.currency(),
                        discordTime: time(date, "R"),
                    })
                    + "\n"
                    + t("pay.pay_confirmation_message", {
                        e,
                        locale: memberLocale,
                        member,
                        user,
                        amount: amount.currency(),
                        discordTime: time(date, "R"),
                    });

                const message = await channel?.send({
                    content,
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    label: t("pay.components.confirm", {
                                        confirms: 0,
                                        locale: interaction.guild.preferredLocale,
                                    }),
                                    emoji: e.MoneyWings.emoji(),
                                    custom_id: JSON.stringify({ c: "pay", src: "accept" }),
                                    style: ButtonStyle.Success,
                                },
                                {
                                    type: ComponentType.Button,
                                    label: t("pay.components.cancel", interaction.guild.preferredLocale),
                                    emoji: e.DenyX.emoji(),
                                    custom_id: JSON.stringify({ c: "pay", src: "cancel" }),
                                    style: ButtonStyle.Danger,
                                },
                            ],
                        },
                    ],
                }).catch(() => undefined);

                if (!message) return;

                const payData = await new Database.Pay({
                    channelId: interaction.channelId,
                    confirm: {
                        payer: false,
                        receiver: false,
                    },
                    expiresAt: date,
                    guildId: interaction.guildId,
                    messageId: message.id,
                    payer: user.id,
                    receiver: member.id,
                    value: amount,
                })
                    .save()
                    .catch((error) => ({ error }));

                if ("error" in payData) {
                    console.log("payData", payData);
                    return await message.edit({
                        content: t("pay.err_to_create_payment", {
                            e,
                            locale,
                            error: payData?.error,
                        }),
                    });
                }

                const pay = new Pay(payData);
                PayManager.cache.set(message.id, pay);
                pay.load();

                await Database.Client.updateOne(
                    { id: client.user?.id as string },
                    { $inc: { TotalBalanceSended: amount } },
                );

                await Database.editBalance(
                    user.id,
                    {
                        createdAt: new Date(),
                        keywordTranslate: "pay.transactions.sended",
                        method: "sub",
                        type: "loss",
                        mode: "pay",
                        value: amount,
                        userIdentify: `${member.user.username} \`${member.user.id}\``,
                    },
                );

                return;

            }

        },
    },
};