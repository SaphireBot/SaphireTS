import { Events, Colors, time } from "discord.js";
import client from "../saphire";
import { e } from "../util/json";
import Database from "../database";
import { prefixCommands } from "../commands";
import socket from "../services/api/ws";
const rateLimit: Record<string, { timeout: number, tries: number }> = {};

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

    if (
        [`<@&${message.guild.members.me?.roles?.botRole?.id}>`, `<@${client.user?.id}>`].includes(message.content)
    ) {
        await message.reply({
            embeds: [{
                color: Colors.Blue,
                title: `${e.Animated.SaphireReading} ${message.guild.name}'s Prefixes`,
                description: `${e.saphirePolicial} | Opa, tudo bem? Meus comandos estão 100% em /slashCommand e alguns estão sendo criados em prefixos.` + "\n \n" + availablePrefix.map((prefix, i) => `${i + 1}. **${prefix}**`).join("\n") || "Nenhum prefixo aqui? OMG!",
                fields: [
                    {
                        name: `${e.Info} Limites`,
                        value: "Cada servidor tem direito a 5 prefixos customizados.",
                    },
                ],
            }],
        }).then(msg => setTimeout(() => msg.delete()?.catch(() => { }), 10000)).catch(() => { });
        return;
    }

    availablePrefix.unshift(`<@${client.user.id}>`, `<@&${message.guild.members.me?.roles?.botRole?.id}>`);

    // Regex by deus do Regex: Gorniaky 395669252121821227 
    const prefixRegex = RegExp(`^(${(availablePrefix).join("|").replace(/[\\]?([.+~*?!^$(){}[\]])/g, "\\$1")})\\s*([\\w\\W]+)`);
    const prefix = message.content.match(prefixRegex);
    if (!prefix) return;

    if (Date.now() < rateLimit[message.author.id]?.timeout) {

        const tries = rateLimit[message.author.id].tries++;

        if (tries === 1) {
            rateLimit[message.author.id].timeout += 1000;
            await message.reply({ content: "⏱️ | Calminha! Você só pode usar outro comando depois de meio segundo. Se você abusar, o seu tempo só vai aumentar." });
            return;
        }

        rateLimit[message.author.id].timeout += tries * 500;
        if (tries === 2) {
            await message.reply({ content: `${e.Animated.SaphireReading} | O seu tempo vai aumentar mais e mais a cada tentativa de comando que você usar dentro do timeout. Pega leve meu jovem. (${time(new Date(rateLimit[message.author.id].timeout), "R")})` });
            return;
        }

        if (!(tries % 10)) {
            await message.reply({ content: `⏱️ | Quanto mais você abusar, mais o seu tempo vai aumentar. (${time(new Date(rateLimit[message.author.id].timeout), "R")})` });
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

    const command = prefixCommands.get(cmd);// || client.prefixAliasesCommands.get(cmd);
    rateLimit[message.author.id] = { timeout: Date.now() + 1000, tries: 0 };
    if (socket?.connected) socket?.send({ type: "addInteraction" });
    if (!command?.execute) {
        console.log("Command Not Found", cmd);
        return;
    }
    if (command)
        await command.execute(message, args)
            .catch(err => {
                console.log(err);
                message.channel.send({ content: `${e.Animated.SaphirePanic} | Deu um erro aqui...\n${e.bug} | \`${err}\`` }).catch(() => { });
                return;
            });
    return;
});