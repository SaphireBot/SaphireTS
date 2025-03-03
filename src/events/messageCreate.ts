import { Events, Colors, time, ButtonStyle, PermissionFlagsBits } from "discord.js";
import client from "../saphire";
import { e } from "../util/json";
import Database from "../database";
import socket from "../services/api/ws";
import { t } from "../translator";
import { AfkManager } from "../managers";
import handler from "../structures/commands/handler";
import { webhooksFeedbackUrls } from "./functions/webhookRestartNotification";
import Experience from "../managers/experience/experience";

const rateLimit: Record<string, { timeout: number, tries: number }> = {};
const channelLockedWarned = new Set<string>();

client.on(Events.MessageCreate, async function (message): Promise<any> {
    client.messages++;

    if (
        !message
        || !message.guild
        || !message.channel
        || !message.guildId
        || message.webhookId
        || !client.user
        || message.system
        || message.author.bot
        || !message.content?.length
        || !("permissionsFor" in message.channel)
        || !message.guild.members.me
        // @ts-exprect-error
        || message.channel.permissionsFor(message.guild.members.me)
            .missing([PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel])
            .length
    ) return;

    Experience.add(message.author.id, 1);
    if (Experience.usersToWarnAboutLevelUp.has(message.author.id))
        Experience.warnLevelUp(message.channel, message.author);

    // Database.setCache(message.author.id, message.author.toJSON(), "user");

    const locale = await message.locale();
    message.userLocale = locale;
    AfkManager.check(message);
    const prefixes = await Database.getPrefix({ guildId: message.guildId, userId: message.author.id });

    if (
        [
            `<@&${message.guild.members.me?.roles?.botRole?.id}>`,
            `<@${client.user?.id}>`,
        ].includes(message.content)
    )
        return await message.reply({
            embeds: [{
                color: Colors.Blue,
                title: `${e.Animated.SaphireReading} ${message.guild.name} ${t("keyword_prefix", locale)}`,
                description: `${e.saphirePolicial} ${t("messageCreate_botmention_embeds[0]_description", locale)}` + "\n \n" + (await Database.getPrefix({ guildId: message.guildId })).map((prefix, i) => `${i + 1}. **${prefix}**`).join("\n") || "OMG!",
                fields: [
                    {
                        name: e.Info + " " + t("messageCreate_botmention_embeds[0]_fields[0]_name", locale),
                        value: t("messageCreate_botmention_embeds[0]_fields[0]_value", locale),
                    },
                ],
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("prefix.set_my_prefix", locale),
                            emoji: e.Animated.SaphireReading.emoji(),
                            custom_id: JSON.stringify({ c: "prefix", src: "user" }),
                            style: ButtonStyle.Primary,
                        },
                    ],
                },
            ],
        }).then(msg => setTimeout(() => msg.delete()?.catch(() => { }), 10000)).catch(() => { });

    // Regex by deus do Regex: Gorniaky 395669252121821227
    const prefixRegex = RegExp(`^(${(prefixes.concat(`<@${client.user.id}>`, `<@&${message.guild.members.me?.roles?.botRole?.id}>`))
        .join("|")
        .replace(/[\^$\\.*+?()[\]{}/]/g, "\\$&")})\\s*([\\w\\W]+)`);

    const prefix = message.content.match(prefixRegex);
    if (!prefix) return;

    if (!client.loaded)
        return await message.react(e.Animated.SaphireSleeping).catch(() => { });

    if (client.rebooting?.started) {
        const msg = await message.reply({
            content: t(
                webhooksFeedbackUrls.has(message.channel.id)
                    ? "Saphire.rebooting.message_no_emoji"
                    : "Saphire.rebooting.message",
                {
                    e, locale,
                    reason: client.rebooting.reason || "No reason given",
                }),
        });
        if (!webhooksFeedbackUrls.has(message.channel.id))
            return await msg.react(e.Notification).catch(() => { });
        return;
    }

    if (client.channelsCommandBlock[message.guildId]?.has(message.channelId)) {
        if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            if (channelLockedWarned.has(message.channelId)) return;
            channelLockedWarned.add(message.channelId);

            const msg = await message.reply({ content: t("channelLock.channel_locked", { e, locale }) });
            setTimeout(async () => msg.delete().catch(() => { }), 1000 * 5);
            return setTimeout(() => channelLockedWarned.delete(message.channelId), 1000 * 20);
        }
    }

    if (Date.now() < rateLimit[message.author.id]?.timeout) {

        const tries = rateLimit[message.author.id].tries++;

        if (tries === 1) {
            rateLimit[message.author.id].timeout += 1000;
            return await message.reply({ content: t("messageCreate_timeout_tries_1_content", locale) });
        }

        rateLimit[message.author.id].timeout += tries * 500;
        if (tries === 2)
            return await message.reply({ content: `${e.Animated.SaphireReading} | ${t("messageCreate_timeout_tries_2_content", locale)} (${time(new Date(rateLimit[message.author.id].timeout), "R")})` });

        if (!(tries % 10))
            return await message.reply({ content: t("messageCreate_timeout_tries_3_content", locale) + ` (${time(new Date(rateLimit[message.author.id].timeout), "R")})` });

        return;
    }

    /**
     * prefix[0] = All Content
     * prefix[1] = prefix
     * prefix[2] = All content without prefix
     * prefix.index | prefix.input | prefix.groups = Just ignore
     */
    const args = prefix[2].trim().split(/ +/g);
    const cmd = args.shift()?.toLowerCase();
    if (!cmd?.length) return;

    const command = handler.getPrefixCommand(cmd);
    socket.send({ type: "addInteraction" });
    if (!command || !("execute" in command) || command.building) return;
    rateLimit[message.author.id] = { timeout: Date.now() + 1000, tries: 0 };

    const commandBugData = handler.isCommandUnderBlock(command.name);
    if (typeof commandBugData === "string")
        return await message.reply({
            content: t("System_Error.CommandWithBugIsLocked", {
                locale,
                e,
                err: `\`${commandBugData || "???"}\``,
            }),
        })
            .then(msg => setTimeout(() => msg.delete(), 1000 * 5));

    if (command && !commandBugData) {

        client.commandsUsed[command.name]++;
        handler.save(message, command.name);
        return await command.execute(message, args || [], cmd)
            .catch(async err => {
                if ([50013, 10008].includes(err?.code)) return;
                console.log("Error to execute a command", err);
                handler.block(command.name, err?.message);
                return await message.channel.send({
                    content: t("messageCreate_commandError_content", {
                        locale,
                        e,
                        err: `\`${err.message || err}\``,
                    }),
                }).catch(() => { });
            });
    }

    return;
});