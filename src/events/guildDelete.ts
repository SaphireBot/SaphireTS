import { Colors, Events, Routes } from "discord.js";
import client from "../saphire";
import { BanManager, CrashManager, GiveawayManager, JokempoManager, PayManager, PearlsManager, ReminderManager, TopGGManager } from "../managers";
import Database from "../database";
import socket from "../services/api/ws";
import { Config } from "../util/constants";
import { e } from "../util/json";
import { guildsShardsStatus } from "./functions/refreshShardStatus";

client.on(Events.GuildDelete, async (guild): Promise<any> => {
    if (!guild?.id || !guild?.name) return;

    const id = guild?.id;
    if (!id) return;

    guildsShardsStatus.delete(id);
    Database.prefixes.delete(id);
    Database.refundAllRaces([id]);
    GiveawayManager.deleteAllGiveawaysFromThisGuild(id);
    JokempoManager.deleteAllFromThisGuild(id);
    PayManager.refundByGuildId(id);
    CrashManager.bulkRefundByGuildId(id);
    BanManager.removeAllFromThisGuild(id);
    ReminderManager.removeAllRemindersFromThisGuild(id);
    TopGGManager.deleteByGuildId(id);
    PearlsManager.guildDelete(id);

    await Database.Games.delete(`Tictactoe.${id}`);
    await Database.Afk.deleteMany({ guildId: id }).catch(() => null);
    await Database.Guilds.deleteOne({ id });
    await Database.Redis?.json.del(id, { path: "$" });
    await Database.Games.delete(`Elimination.${id}`);

    socket.send({ type: "guildDelete", id });

    return await client.rest.post(
        Routes.channelMessages(Config.LogChannelId),
        {
            body: {
                content: null,
                embeds: [{
                    color: Colors.Red,
                    title: `${e.Animated.SaphireCry} Um servidor me removeu`,
                    description: `📝 ${guild.name}\n🆔 \`${id}\`\n👥 ${guild.memberCount} Membros`,
                    thumbnail: { url: guild.iconURL() },
                }],
            },
        },
    )
        .catch(async err => {
            return await client.users.send(Config.Andre,
                {
                    content: `${e.Animated.SaphirePanic} Deu ruim chefia \`#Events.GuildDelete\`\n${e.bug} | \`${err}\``,
                },
            )
                .catch(() => { });
        });

});