import client from "../../saphire";
import { urls } from "../../util/constants";
import { env } from "process";
import { Vote } from "../../@types/database";
import { AutoPoster } from "topgg-autoposter";

export default class TopGGManager {
    timeouts: Record<string, NodeJS.Timeout> = {};
    constructor() { }

    async load(guildsId: string[]) {
        if (!guildsId?.length) return;

        AutoPoster(env.TOP_GG_TOKEN, client);

        const votes = await fetch(
            `${urls.saphireApiUrl}/topgg?${guildsId.map(id => `guildId=${id}`).join("&")}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } },
        )
            .then(res => res.json())
            .catch(() => []) as Vote[];

        if (!votes?.length) return;

        for (const vote of votes) this.init(vote);
        return;
    }

    async fetch(userId: string) {
        return await fetch(
            `${urls.saphireApiUrl}/topgg/${userId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } },
        )
            .then(res => res.json())
            .catch(() => undefined) as Vote | undefined;
    }

    init(vote?: Vote) {

        if (!vote?.guildId || !vote.userId || !client.guilds.cache.has(vote.guildId)) return;

        if (this.timeouts[vote.userId]) return;
        this.timeouts[vote.userId] = setTimeout(async () => await this.delete(vote), (vote.deleteAt || Date.now()) - Date.now());
    }

    async createOrUpdate(data: { userId: string, data: { $set: Vote } }) {
        return await fetch(
            `${urls.saphireApiUrl}/topgg`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    authorization: env.APIV2_AUTHORIZATION_KEY,
                },
                body: JSON.stringify(data),
            },
        )
            .then(res => res.json())
            .catch(() => null);
    }

    async delete(vote?: Vote | any) {
        if (!vote) return;
        clearTimeout(this.timeouts[vote.userId!]);
        delete this.timeouts[vote.userId!];

        await fetch(
            `${urls.saphireApiUrl}/topgg/${vote.userId}`,
            {
                method: "DELETE",
                headers: { authorization: env.APIV2_AUTHORIZATION_KEY },
            },
        );

        return;
    }

    async deleteByUserId(userId: string): Promise<void> {
        if (!userId) return;
        const vote = await fetch(
            `${urls.saphireApiUrl}/topgg/${userId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } },
        )
            .then(res => res.json())
            .catch(() => null) as Vote | null;
        if (!vote) return;
        return await this.delete(vote);
    }

    async deleteByMessageId(messageId: string) {
        if (!messageId) return;
        const vote = await fetch(
            `${urls.saphireApiUrl}/topgg?messageId=${messageId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } },
        )
            .then(res => res.json())
            .catch(() => []) as Vote[];
        return await this.delete(vote?.[0]);
    }

    async bulkDeleteByMessageId(messagesId: string[]) {
        if (!messagesId?.length) return;
        const votes = await fetch(
            `${urls.saphireApiUrl}/topgg?${messagesId.map(id => `messageId=${id}`).join("&")}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } },
        )
            .then(res => res.json())
            .catch(() => null) as Vote | Vote[] | null;

        if (!votes) return;

        if (Array.isArray(votes))
            return await Promise.all(votes?.map(vote => this.delete(vote)));

        return this.delete(votes);
    }

    async deleteByChannelId(channelId: string) {
        if (!channelId) return;
        const vote = await fetch(
            `${urls.saphireApiUrl}/topgg?channelId=${channelId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } },
        )
            .then(res => res.json())
            .catch(() => null) as Vote[] | null;
        if (!vote) return;
        return await this.delete(vote?.[0]);
    }

    async deleteByGuildId(guildId: string) {
        if (!guildId) return;
        const vote = await fetch(
            `${urls.saphireApiUrl}/topgg?guildId=${guildId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } },
        )
            .then(res => res.json())
            .catch(() => []) as Vote[];
        return await this.delete(vote?.[0]);
    }

}