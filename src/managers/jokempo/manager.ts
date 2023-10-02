import Database from "../../database";
import { JokempoSchema } from "../../database/models/jokempo";
import client from "../../saphire";
import Jokempo from "../../structures/jokempo/jokempo";

export default class JokempoManager {
    cache = new Map<string, Jokempo>();

    constructor() { }

    async load() {
        const allGames = await Database.Jokempo.find({ guildId: Array.from(client.guilds.cache.keys()) });
        for (const game of allGames)
            new Jokempo(game).load();
    }

    async set(data: JokempoSchema): Promise<Jokempo | void> {
        if (!data) return;
        return await new Jokempo(data).load();
    }

    async deleteAllFromThisChannel(channelId: string) {
        for (const game of this.cache.values())
            if (game?.channelId === channelId) {
                const jokempo = this.cache.get(game?.messageId);
                if (!jokempo) continue;
                jokempo.delete();
                continue;
            }
        return;
    }

    async deleteAllFromThisGuild(guildId: string) {
        for (const game of this.cache.values())
            if (game?.guildId === guildId) {
                const jokempo = this.cache.get(game?.messageId);
                if (!jokempo) continue;
                jokempo.delete();
                continue;
            }
        return;
    }

    async deleteAllFromThisUser(userId: string) {
        for (const game of this.cache.values())
            if ([game?.createdBy, game?.opponentId].includes(userId)) {
                const jokempo = this.cache.get(game?.messageId);
                if (!jokempo) continue;
                jokempo.delete();
                continue;
            }
        return;
    }

    async deleteAllGamesWithThisMemberFromThisGuild(guildId: string, memberId: string) {

        const gamesToDelete = Array.from(this.cache.values())
            .filter(jkp => jkp.guildId === guildId && [jkp.createdBy, jkp.opponentId].includes(memberId));

        for (const game of gamesToDelete)
            this.cache.get(game?.messageId)?.delete();

    }

    async messageDeleteEvent(messageId: string) {
        if (!messageId) return;
        return this.cache.get(messageId)?.delete();
    }
}