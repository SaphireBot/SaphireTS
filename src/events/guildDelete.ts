import { Colors, Events, Routes } from "discord.js";
import client from "../saphire";
import { BanManager, CrashManager, GiveawayManager, JokempoManager, PayManager, ReminderManager, TopGGManager } from "../managers";
import { members } from "../database/cache";
import Database from "../database";
import socket from "../services/api/ws";
import { Config } from "../util/constants";
import { e } from "../util/json";

client.on(Events.GuildDelete, async (guild): Promise<any> => {

    if (!guild?.id) return;

    for (const key of members.keys())
        if (key.includes(guild.id))
            members.delete(key);

    Database.prefixes.delete(guild.id);
    GiveawayManager.deleteAllGiveawaysFromThisGuild(guild.id, true);
    JokempoManager.deleteAllFromThisGuild(guild.id);
    PayManager.refundByGuildId(guild.id);
    CrashManager.bulkRefundByGuildId(guild.id);
    BanManager.removeAllFromThisGuild(guild.id);
    ReminderManager.removeAllRemindersFromThisGuild(guild.id);
    TopGGManager.deleteByGuildId(guild.id);

    await Database.Afk.deleteMany({ guildId: guild.id });
    await Database.Guilds.deleteOne({ id: guild.id });
    await Database.Redis.json.del(guild.id, "$");

    socket.send({ type: "guildDelete", id: guild.id });

    return await client.rest.post(
        Routes.channelMessages(Config.LogChannelId),
        {
            body: {
                content: null,
                embeds: [{
                    color: Colors.Red,
                    title: `${e.Animated.SaphireCry} Um servidor me removeu`,
                    description: `📝 ${guild.name}\n🆔 \`${guild.id}\`\n👥 ${guild.memberCount} Membros`,
                    thumbnail: { url: guild.iconURL() }
                }],
            }
        }
    )
        .catch(async err => {
            return await client.users.send(Config.Andre,
                {
                    content: `${e.Animated.SaphirePanic} Deu ruim chefia \`#Events.GuildDelete\`\n${e.bug} | \`${err}\``
                }
            )
                .catch(() => { });
        });

});