import { Events, Colors, time } from "discord.js";
import client from "../saphire";
import { e } from "../util/json";
import Database from "../database";
import { prefixAliasesCommands, prefixCommands } from "../commands";
import socket from "../services/api/ws";
import { t } from "../translator";
const rateLimit: Record<string, { timeout: number, tries: number }> = {};
const buggedCommands = new Map<string, string>();

client.on(Events.MessageCreate, async function (message) {

    if (
        !message
        || !message.guild
        || !message.channel
        || !message.guildId
        || message.webhookId
        || !client.user
        || message.system
        || message.author.bot
    ) return;

    if (!message.content?.length) return;

    const availablePrefix = await Database.getPrefix(message.guildId);
    const locale = await message.author.locale();

    if (
        [`<@&${message.guild.members.me?.roles?.botRole?.id}>`, `<@${client.user?.id}>`].includes(message.content)
    ) {
        await message.reply({
            embeds: [{
                color: Colors.Blue,
                title: `${e.Animated.SaphireReading} ${message.guild.name} ${t("keyword_prefix", locale)}`,
                description: `${e.saphirePolicial} | ${t("messageCreate_botmention_embeds[0]_description", locale)}` + "\n \n" + availablePrefix.map((prefix, i) => `${i + 1}. **${prefix}**`).join("\n") || "OMG!",
                fields: [
                    {
                        name: e.Info + " " + t("messageCreate_botmention_embeds[0]_fields[0]_name", locale),
                        value: t("messageCreate_botmention_embeds[0]_fields[0]_value", locale)
                    }
                ]
            }]
        }).then(msg => setTimeout(() => msg.delete()?.catch(() => { }), 10000)).catch(() => { });
        return;
    }

    // Regex by deus do Regex: Gorniaky 395669252121821227
    const prefixRegex = RegExp(`^(${([...availablePrefix, `<@${client.user.id}>`, `<@&${message.guild.members.me?.roles?.botRole?.id}>`]).join("|").replace(/[\\]?([.+~*?!^$(){}[\]])/g, "\\$1")})\\s*([\\w\\W]+)`);
    const prefix = message.content.match(prefixRegex);
    if (!prefix) return;

    if (Date.now() < rateLimit[message.author.id]?.timeout) {

        const tries = rateLimit[message.author.id].tries++;

        if (tries === 1) {
            rateLimit[message.author.id].timeout += 1000;
            await message.reply({ content: t("messageCreate_timeout_tries_1_content", locale) });
            return;
        }

        rateLimit[message.author.id].timeout += tries * 500;
        if (tries === 2) {
            await message.reply({ content: `${e.Animated.SaphireReading} | ${t("messageCreate_timeout_tries_2_content", locale)} (${time(new Date(rateLimit[message.author.id].timeout), "R")})` });
            return;
        }

        if (!(tries % 10)) {
            await message.reply({ content: t("messageCreate_timeout_tries_3_content", locale) + `(${time(new Date(rateLimit[message.author.id].timeout), "R")})` });
            return;
        }

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

    const command = prefixCommands.get(cmd) || prefixAliasesCommands.get(cmd);
    rateLimit[message.author.id] = { timeout: Date.now() + 1000, tries: 0 };
    if (socket?.connected) socket?.send({ type: "addInteraction" });
    if (!command?.execute) {
        console.log("Command Not Found", cmd);
        return;
    }

    if (buggedCommands.has(cmd)) {
        await message.reply({
            content: t("System_Error.CommandWithBugIsLocked", {
                locale,
                e,
                err: `\`${buggedCommands.get(cmd) || "???"}\``
            })
        })
            .then(msg => setTimeout(() => msg.delete(), 1000 * 5));
        return;
    }

    if (command && !buggedCommands.has(cmd)) {
        message.userLocale = await message.author.locale() || message.guild.preferredLocale;
        await command.execute(message, args)
            .catch(async err => {
                console.log(err);
                buggedCommands.set(cmd, err.message || err);
                return await message.channel.send({
                    content: t("messageCreate_commandError_content", {
                        locale,
                        e,
                        err: `\`${err.message || err}\``
                    })
                }).catch(() => { });
            });
    }
    return;
});