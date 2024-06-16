import client from "../../saphire";
import { urls } from "../../util/constants";
import { env } from "process";
import { Vote } from "../../@types/database";

export default class TopGGManager {
    timeouts: Record<string, NodeJS.Timeout> = {};
    constructor() { }

    async load(guildsId: string[]) {
        if (!guildsId?.length) return;

        const votes = await fetch(
            `${urls.saphireApiV2}/topgg?${guildsId.map(id => `guildId=${id}`).join("")}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        )
            .then(res => res.json())
            .catch(() => []) as Vote[];

        if (!votes?.length) return;

        for (const vote of votes) this.init(vote);
        return;
    }

    async fetch(userId: string) {
        return await fetch(
            `${urls.saphireApiV2}/topgg/${userId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        )
            .then(res => res.json()) as Vote | undefined;
    }

    init(vote?: Vote) {

        if (!vote?.guildId || !vote.userId || !client.guilds.cache.has(vote.guildId)) return;

        if (this.timeouts[vote.userId]) return;
        this.timeouts[vote.userId] = setTimeout(async () => await this.delete(vote), (vote.deleteAt || Date.now()) - Date.now());
    }

    async createOrUpdate(data: Vote) {
        return await fetch(
            `${urls.saphireApiV2}/topgg`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    authorization: env.APIV2_AUTHORIZATION_KEY
                },
                body: JSON.stringify(data)
            }
        );
    }

    async delete(vote?: Vote | any) {
        if (!vote) return;
        clearTimeout(this.timeouts[vote.userId!]);
        delete this.timeouts[vote.userId!];

        await fetch(
            `${urls.saphireApiV2}/topgg/${vote.userId}`,
            {
                method: "DELETE",
                headers: { authorization: env.APIV2_AUTHORIZATION_KEY }
            }
        );

        return;
    }

    async deleteByUserId(userId: string) {
        if (!userId) return;
        const vote = await fetch(
            `${urls.saphireApiV2}/topgg/${userId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        )
            .then(res => res.json()) as Vote;
        return await this.delete(vote);
    }

    async deleteByMessageId(messageId: string) {
        if (!messageId) return;
        const vote = await fetch(
            `${urls.saphireApiV2}/topgg?messageId=${messageId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        )
            .then(res => res.json()) as Vote[];
        return await this.delete(vote?.[0]);
    }

    async bulkDeleteByMessageId(messagesId: string[]) {
        if (!messagesId?.length) return;
        const votes = await fetch(
            `${urls.saphireApiV2}/topgg?${messagesId.map(id => `messageId=${id}`).join("")}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        )
            .then(res => res.json()) as Vote | Vote[];

        if (Array.isArray(votes))
            return await Promise.all(votes?.map(vote => this.delete(vote)));

        return this.delete(votes);
    }

    async deleteByChannelId(channelId: string) {
        if (!channelId) return;
        const vote = await fetch(
            `${urls.saphireApiV2}/topgg?channelId=${channelId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        )
            .then(res => res.json()) as Vote[];
        return await this.delete(vote?.[0]);
    }

    async deleteByGuildId(guildId: string) {
        if (!guildId) return;
        const vote = await fetch(
            `${urls.saphireApiV2}/topgg?guildId=${guildId}`,
            { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        )
            .then(res => res.json()) as Vote[];
        return await this.delete(vote?.[0]);
    }

}