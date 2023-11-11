import { ChatInputCommandInteraction, Colors, codeBlock, time, Message, User, GuildMember, APIInteractionGuildMember } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import { getLocalizations } from "../../../util/getlocalizations";
import { Config } from "../../../util/constants";
import { ReminderManager } from "../../../managers";
import { randomBytes } from "crypto";

let interactionId: string | undefined = "";
const cooldown = new Map<string, number>();
const prizes = {
    1: { day: 1, money: 200, xp: 150 },
    2: { day: 2, money: 0, xp: 3000 },
    3: { day: 3, money: 300, xp: 100 },
    4: { day: 4, money: 400, xp: 4000 },
    5: { day: 5, money: 500, xp: 250 },
    6: { day: 6, money: 600, xp: 350 },
    7: { day: 7, money: 7000, xp: 7000 },
    8: { day: 8, money: 800, xp: 150 },
    9: { day: 9, money: 900, xp: 150 },
    10: { day: 10, money: 1000, xp: 1050 },
    11: { day: 11, money: 350, xp: 700 },
    12: { day: 12, money: 570, xp: 750 },
    13: { day: 13, money: 800, xp: 1250 },
    14: { day: 14, money: 14000, xp: 14000 },
    15: { day: 15, money: 200, xp: 150 },
    16: { day: 16, money: 200, xp: 150 },
    17: { day: 17, money: 1210, xp: 1150 },
    18: { day: 18, money: 1500, xp: 0 },
    19: { day: 19, money: 1500, xp: 9000 },
    20: { day: 20, money: 1000, xp: 150 },
    21: { day: 21, money: 3500, xp: 150 },
    22: { day: 22, money: 7500, xp: 150 },
    23: { day: 23, money: 1000, xp: 2000 },
    24: { day: 24, money: 2000, xp: 3000 },
    25: { day: 25, money: 3000, xp: 4000 },
    26: { day: 26, money: 5000, xp: 5000 },
    27: { day: 27, money: 6000, xp: 6000 },
    28: { day: 28, money: 7000, xp: 7000 },
    29: { day: 29, money: 8000, xp: 8000 },
    30: { day: 30, money: 9000, xp: 9000 },
    31: { day: 31, money: 30000, xp: 1000 }
};

export default async function daily(
    interactionOrMessage: ChatInputCommandInteraction | Message
) {

    const { userLocale: locale, guild } = interactionOrMessage;
    let user: User;
    let member: GuildMember | null | APIInteractionGuildMember = null;
    let userTransfer: User | null | undefined;

    if (interactionOrMessage instanceof ChatInputCommandInteraction) {
        interactionId = interactionOrMessage.commandId;
        user = interactionOrMessage.user;
        member = interactionOrMessage.member;
        userTransfer = interactionOrMessage.options.getUser("transfer");
    } else {
        user = interactionOrMessage.author;
        member = interactionOrMessage.member;
        userTransfer = await interactionOrMessage.getUser();
    }

    const inCooldown = cooldown.get(user.id) || 0;

    if (inCooldown >= Date.now())
        return await interactionOrMessage.reply({ content: t("daily.cooldown", { e, locale }) });

    cooldown.set(user.id, Date.now() + 3000);

    const msg = await interactionOrMessage.reply({ content: t("daily.loading", { e, locale }) });

    if (userTransfer?.bot)
        return await msg.edit({ content: t("daily.bot_is_not_allowed", { e, locale }) });

    const userData = await Database.getUser(user.id);

    let content: string = "";
    const count = userData?.DailyCount || 0;
    let dailyTimeout = userData?.Timeouts?.Daily || 0;
    const oneDayInMilliseconds = 1000 * 60 * 60 * 24;

    if (
        (count > 0 && dailyTimeout > 0)
        && !Date.Timeout(172800000, dailyTimeout)
    ) {
        await resetSequence();
        dailyTimeout = 0;
        content = t("daily.you_lost_the_sequency", { e, locale });
    }

    if (Date.Timeout(oneDayInMilliseconds, dailyTimeout)) {

        const response = {
            content: t("daily.next_daily_in", {
                e,
                locale,
                time: time(new Date(dailyTimeout + oneDayInMilliseconds), "R"),
                prefix: (await Database.getPrefix(guild?.id))?.random(),
                interactionId,
                option: getLocalizations("daily.options.1.name")?.[locale] || "options",
                dailyStatus: getLocalizations("daily.options.1.choices.0")?.[locale] || "Daily Status",
                daily: getLocalizations("daily.name")?.[locale] || "daily"
            }),
            ephemeral: true
        };

        if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            await msg.delete();
            return await interactionOrMessage.followUp(response);
        }

        return await msg.edit(response);
    }

    const clientData = await Database.getClientData();
    const isVip = userData?.Vip?.Permanent || (userData?.Vip?.TimeRemaing || 0) - (Date.now() - (userData?.Vip?.DateNow || 0)) > 0;
    let unshiftTotalResults = false;

    const prize: { day: number, money: number, xp: number } = Object.assign(
        {},
        prizes[count as keyof typeof prizes] || {
            day: count,
            money: parseInt(Math.floor(Math.random() * 10000).toFixed(0)),
            xp: parseInt(Math.floor(Math.random() * 10000).toFixed(0))
        }
    );

    const fields: { name: string, value: string }[] = [];
    const money = prize.money;
    const xp = prize.xp;

    if (guild && guild.id === Config.guildId) bonusCalculate(0.5, 0);
    if (clientData?.Titles?.BugHunter?.includes(user.id)) bonusCalculate(0.3, 1);
    if (clientData?.PremiumServers?.includes(guild?.id)) bonusCalculate(0.6, 2);
    if (isVip) bonusCalculate(0.7, 3);
    if (member && "premiumSinceTimestamp" in member ? member.premiumSinceTimestamp : null) bonusCalculate(0.35, 4);

    const days = Object.values(prizes).map(d => d.day);
    const calendar = prize.day <= 31
        ? days.map((num, i) => formatCalendar(prize, num, i)).join("")
        : t("daily.over_calender", locale);

    fields.unshift({
        name: t("daily.fields_name.5", { locale, e, total: unshiftTotalResults ? ` (${t("daily.total", locale)})` : "" }),
        value: t("daily.field_value", { locale, e, money: prize.money, xp: prize.xp })
    });

    fields.push({
        name: t("daily.fields_name.6", locale),
        value: codeBlock("TXT", calendar)
    });

    await setNewDaily();
    return await msg.edit({
        content,
        embeds: [{
            color: Colors.Blue,
            title: t("daily.embed.title", { e, locale }),
            description: userTransfer
                ? t("daily.transfer", { e, locale, user: userTransfer })
                : t("daily.embed.description", { e, locale, prize }),
            fields
        }]
    });

    async function resetSequence() {

        await Database.Users.updateOne(
            { id: user.id },
            {
                $unset: {
                    "Timeouts.Daily": 1,
                    DailyCount: 1
                }
            }
        );

        return;
    }

    function bonusCalculate(porcent: number, fieldIndex: number) {
        unshiftTotalResults = true;
        const moneyToAdd = parseInt(Math.floor(money * porcent).toFixed(0));
        const xpToAdd = parseInt(Math.floor(xp * porcent).toFixed(0));
        prize.money += moneyToAdd;
        prize.xp += xpToAdd;
        fields.push({
            name: t(`daily.fields_name.${fieldIndex}`, { e, locale }),
            value: t("daily.field_value", { locale, e, money: money.currency(), xp: xp.currency() })
        });
        return;
    }

    function formatCalendar(prize: { day: number, money: number, xp: number }, num: number, i: number) {
        const breakLine = [7, 14, 21, 28].includes(i + 1) ? " \n" : " ";
        return num <= prize.day
            ? `${num <= 9 ? `0${num}` : num}${breakLine}`
            : `XX${breakLine}`;
    }

    async function setNewDaily() {

        const dateNow = Date.now();

        if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            const optionReminder = interactionOrMessage.options.getString("options");

            if (optionReminder === "reminder") {
                ReminderManager.save({
                    alerted: false,
                    channelId: interactionOrMessage.channelId,
                    createdAt: new Date(),
                    guildId: interactionOrMessage.guildId,
                    id: randomBytes(10).toString("base64url"),
                    interval: 0,
                    isAutomatic: true,
                    message: "reminder.dailyReminder",
                    sendToDM: false,
                    lauchAt: new Date(Date.now() + (1000 * 60 * 60 * 24)),
                    userId: interactionOrMessage.user.id
                });
            }

            if (optionReminder === "reminderPrivate") {
                ReminderManager.save({
                    alerted: false,
                    channelId: null,
                    createdAt: new Date(),
                    guildId: null,
                    id: randomBytes(10).toString("base64url"),
                    interval: 0,
                    isAutomatic: true,
                    message: "reminder.dailyReminder",
                    sendToDM: true,
                    lauchAt: new Date(Date.now() + (1000 * 60 * 60 * 24)),
                    userId: interactionOrMessage.user.id
                });
            }

        }

        if (userTransfer) {

            await Database.editBalance(
                userTransfer?.id || "",
                {
                    createdAt: new Date(),
                    keywordTranslate: "daily.transactions.transfer",
                    method: "add",
                    mode: "daily",
                    type: "gain",
                    value: prize.money,
                    userIdentify: `${user.username} \`${user.id}\``
                }
            );

            await Database.Users.updateOne(
                { id: user.id },
                {
                    $set: { "Timeouts.Daily": dateNow },
                    $inc: { DailyCount: 1 }
                },
                { upsert: true }
            );
        }

        await Database.Users.updateOne(
            { id: user.id },
            {
                $inc: {
                    Xp: prize.xp,
                    DailyCount: 1
                },
                $set: { "Timeouts.Daily": dateNow }
            },
            { upsert: true }
        );

        await Database.editBalance(
            user.id,
            {
                createdAt: new Date(),
                keywordTranslate: "daily.transactions.claimmed",
                method: "add",
                mode: "daily",
                type: "gain",
                value: prize.money,
                userIdentify: `${count}`
            }
        );
    }
}