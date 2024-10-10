import { ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import Database from "../../../../database";
import { JokempoManager } from "../../../../managers";
import { allWordTranslations } from "../../../../util/constants";
import { randomBytes } from "crypto";

export default async function inGuildJokempo(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
    args?: string[],
) {

    const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;
    const locale = interactionOrMessage?.userLocale;
    const opponent = interactionOrMessage instanceof Message
        ? (await interactionOrMessage.parseMemberMentions()).first()
        : interactionOrMessage.options.getMember("member");

    const value = interactionOrMessage instanceof Message
        ? await (async () => {

            if (args?.some(str => allWordTranslations.includes(str?.toLowerCase())))
                return (await Database.getUser(user.id))?.Balance || 0;

            let v = 0;
            for (const arg of args || [])
                if (typeof arg === "string") {
                    const num = arg.toNumber();
                    if (typeof num === "number" && num > 0
                    )
                        v += num;
                }
            return v;
        })()
        : interactionOrMessage.options.getInteger("bet") || 0;

    if (!opponent?.user?.id) {
        const prefix = (await Database.getPrefix({ guildId: interactionOrMessage.guildId })).random();
        return await interactionOrMessage.reply({ content: `${e.Animated.SaphireReading} | ${t("jokempo.no_member_found", { locale, prefix: prefix || "-" })}` });
    }
    if (opponent?.user?.id === user.id) return await interactionOrMessage.reply({ content: `${e.Animated.SaphirePanic} | ${t("jokempo.you_select_you_omg", locale)}` });
    if (opponent.user.bot) return await interactionOrMessage.reply({ content: `${e.Animated.SaphireSleeping} | ${t("jokempo.select_a_bot", locale)}` });

    const message = await interactionOrMessage.reply({ content: t("jokempo.creating_new_game", { e, locale }), fetchReply: true });
    const usersData = await Database.getUsers([user.id, opponent?.user.id]);
    const userBalance = usersData.find(data => data.id === user.id)?.Balance || 0;
    const opponentBalance = usersData.find(data => data.id === opponent?.user?.id)?.Balance || 0;

    if (value > 0 && userBalance < value)
        return await message.edit({
            content: t("jokempo.no_balance_enough", {
                locale,
                e,
                valueMinusUserValue: (value - userBalance).currency() || 0,
                value: value.currency() || 0,
                userBalance: userBalance.currency() || 0,
            }).limit("MessageContent"),
        });

    if (value > 0 && opponentBalance < value)
        return await message.edit({
            content: t("jokempo.member_balance_not_enough", {
                locale,
                e,
                opponentUsername: opponent.user.username,
                value: value.currency() || 0,
            }).limit("MessageContent"),
        });

    const opponentLocale = await opponent.user?.locale() || interactionOrMessage.guild?.preferredLocale || undefined;
    const date = new Date();
    date.setDate(date.getDate() + 7);

    const jokempoSchema = await Database.Jokempo.create({
        value: isNaN(value) ? 0 : value,
        channelId: interactionOrMessage.channelId,
        guildId: interactionOrMessage.guildId,
        id: randomBytes(10).toString("base64url"),
        createdBy: user.id,
        opponentId: opponent?.user.id,
        expiresAt: date,
        messageId: message?.id,
        clicks: {
            [opponent?.user?.id]: "",
            [user?.id]: "",
        },
    })
        .then(doc => doc.toObject())
        .catch(err => console.log("Database.Jokempo.create", err));

    if (!jokempoSchema)
        return message.edit({
            content: t("jokempo.fail_to_save_game_information", { e, locale }),
        });

    const jokempo = await JokempoManager.set(jokempoSchema);

    if (!jokempo) {
        await Database.Jokempo.deleteOne({ messageId: message?.id });

        return await message.edit({
            content: t("jokempo.fail_to_set_giveaway", { e, locale }),
        });
    }

    await message.edit({
        content: t("jokempo.ask_to_init_a_new_game", {
            locale: opponentLocale,
            e,
            opponent,
            user,
            value: `${value.currency() || 0}`,
        }),
        components: [{
            type: 1,
            components: [
                {
                    type: 2,
                    emoji: ["🤛", "✌️", "🖐️"].random()!.emoji(),
                    label: t("keyword_accept", opponentLocale),
                    custom_id: JSON.stringify({ c: "jkp", type: "start", value, userId: opponent.id }),
                    style: ButtonStyle.Success,
                },
                {
                    type: 2,
                    emoji: e.DenyX.emoji(),
                    label: t("keyword_refuse", opponentLocale),
                    custom_id: JSON.stringify({ c: "jkp", type: "deny", userId: opponent.id }),
                    style: ButtonStyle.Danger,
                },
            ],
        }],
    });

    if (!message) return;

    if (value > 0)
        await Database.editBalance(
            user.id,
            {
                createdAt: new Date(),
                keywordTranslate: "jokempo.transactions.loss",
                type: "loss",
                value,
                mode: "jokempo",
                method: "sub",
            },
        );

}