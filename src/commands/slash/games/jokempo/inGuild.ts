import { ButtonStyle, ChatInputCommandInteraction, GuildMember, Message } from "discord.js";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
// import client from "../../../../saphire";
import Database from "../../../../database";
import socket from "../../../../services/api/ws";

export default async function inGuildJokempo(interaction: ChatInputCommandInteraction) {

    const { options, user, userLocale } = interaction;
    const opponent = options.getMember("member") as GuildMember;
    const value = options.getInteger("bet") || 0;

    if (!opponent?.id) return await interaction.reply({ content: `${e.Animated.SaphireReading} | ${t("jokempo.no_member_found", userLocale)}` });
    if (opponent.id === user.id) return await interaction.reply({ content: `${e.Animated.SaphirePanic} | ${t("jokempo.you_select_you_omg", userLocale)}` });
    if (opponent.user.bot) return await interaction.reply({ content: `${e.Animated.SaphireSleeping} | ${t("jokempo.select_a_bot", userLocale)}` });

    const message = await interaction.reply({ content: t("jokempo.creating_new_game", { e, locale: userLocale }), fetchReply: true }) as Message<boolean>;

    const usersData = await Database.getUsers([user.id, opponent.id]);
    const userBalance = usersData.find(data => data.id === user.id)?.Balance || 0;
    const opponentBalance = usersData.find(data => data.id === opponent.id)?.Balance || 0;

    if (value > 0 && userBalance < value)
        return await interaction.editReply({
            content: t("jokempo.no_balance_enough", {
                locale: userLocale,
                e,
                valueMinusUserValue: (value - userBalance).currency(),
                value: value.currency(),
                userBalance: userBalance.currency()
            })
        });

    if (value > 0 && opponentBalance < value)
        return await interaction.editReply({
            content: t("jokempo.member_balance_not_enough", {
                locale: userLocale,
                e,
                opponentUsername: opponent.user.username,
                value: value.currency()
            })
        });

    const opponentLocale = await opponent.user.locale() || interaction.guildLocale || undefined;
    await interaction.editReply({
        content: t("jokempo.ask_to_init_a_new_game", {
            locale: opponentLocale,
            e,
            opponent,
            user,
            value: value.currency()
        }),
        components: [{
            type: 1,
            components: [
                {
                    type: 2,
                    emoji: ["🤛", "✌️", "🖐️"].random().emoji(),
                    label: t("keyword_accept", opponentLocale),
                    custom_id: JSON.stringify({ c: "jkp", type: "start", value, userId: opponent.id }),
                    style: ButtonStyle.Success
                },
                {
                    type: 2,
                    emoji: e.DenyX.emoji(),
                    label: t("keyword_refuse", opponentLocale),
                    custom_id: JSON.stringify({ c: "jkp", type: "deny", userId: opponent.id }),
                    style: ButtonStyle.Danger
                },
            ]
        }]
    });

    if (!message) return;

    if (value > 0) {

        const transaction = {
            time: `${Date.format(0, userLocale, true)}`,
            data: `${e.loss} Apostou ${value} Safiras no Jokempo`
        };

        socket?.send({
            type: "transactions",
            transactionsData: { value, userId: user.id, transaction }
        });

        await Database.Users.findOneAndUpdate(
            { id: user.id },
            {
                $inc: { Balance: -value },
                $push: {
                    Transactions: {
                        $each: [transaction],
                        $position: 0
                    }
                }
            },
            { upsert: true, new: true }
        );
    }

    // await Database.Cache.Jokempo.set(
    //     message.id,
    //     {
    //         players: [user.id],
    //         value,
    //         clicks: {
    //             [user.id]: null,
    //             [opponent.id]: null
    //         }
    //     }
    // );

}