import { ChannelType, Events, Colors } from "discord.js";
import client from "../saphire";
import { e } from "../util/json";
import Database from "../database";
import { prefixCommands } from "../commands";

client.on(Events.MessageCreate, async function (message) {

    if (
        !message
        || !message.id
        || !message.guild
        || !message.channel
        || message.webhookId
        || message.system
        || message.author?.bot
        || message.channel?.type === ChannelType.DM
    ) return;

    if (!message.content?.length) return;

    if (
        [`<@&${message.guild.members.me?.roles?.botRole?.id}>`, `<@${client.user?.id}>`].includes(message.content)
    ) {
        await message.reply({
            embeds: [{
                color: Colors.Blue,
                title: `${e.Animated.SaphireReading} ${message.guild.name}'s Prefixes`,
                description: `${e.saphirePolicial} | Opa, tudo bem? Meus comandos estão 100% em /slashCommand e alguns estão sendo criados em prefixos.` + "\n \n" + (await Database.getPrefix(message.guild.id)).map((pr, i) => `${i + 1}. **${pr}**`).join("\n"),
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

    if (prefixCommands.has(message.content)) {
        prefixCommands.get(message.content)?.execute(message);
        return;
    }
});