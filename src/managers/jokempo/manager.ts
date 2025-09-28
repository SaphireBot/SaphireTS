import Database from "../../database";
import { JokempoSchemaType } from "../../database/schemas/jokempo";
import Jokempo from "../../structures/jokempo/jokempo";

export default class JokempoManager {
    cache = new Map<string, Jokempo>();

    constructor() { }

    async load(guildsId: string[]) {
        if (!guildsId?.length) return;
        const allGames = await Database.Jokempos.find({ guildId: guildsId });
        for (const game of allGames)
            new Jokempo(game).load();
    }

    async set(data: JokempoSchemaType): Promise<Jokempo | void> {
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