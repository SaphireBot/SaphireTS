import { saphireClientOptions } from "../util/client";
import { Client, Routes, Guild, APIGuild } from "discord.js";
import { env } from "process";
import Database from "../database";
import { ClientSchema } from "../database/models/client";

export default class Saphire extends Client {
    declare shardId: number;
    declare interactions: number;
    declare messages: number;
    declare commandsUsed: Record<string, number>;
    declare restart: boolean;
    declare loaded: boolean;
    declare blacklisted: Set<string>;
    declare data: ClientSchema | null;
    declare clusterName: string;

    constructor() {
        super(saphireClientOptions);
        this.clusterName = "Gargantua";
        this.interactions = 0;
        this.messages = 0;
        this.commandsUsed = {};
        this.loaded = false;
        this.blacklisted = new Set<string>();
        this.data = null;
    }

    async start() {
        super.login();

        const clusterName = {
            discloud: "Bellatrix",
            localhost: "Gargantua"
        }[env.MACHINE] || "Antares";

        this.clusterName = clusterName;
        return;
    }

    async getData() {
        const data = this.data;

        if (data) return data;

        this.data = await Database.getClientData();
        return this.data;
    }

    async getGuild(guildId: string | undefined): Promise<Guild | APIGuild | undefined> {
        if (!guildId) return;

        const data = await this.guilds.fetch(guildId);
        if (data) return data;

        const fetchData = await this.rest.get(Routes.guild(guildId)).catch(() => undefined) as APIGuild | undefined;
        if (fetchData) return fetchData;
        return undefined;
    }

    get shardStatus() {
        return {
            discloud: {
                shardList: [0, 1, 2],
                totalShards: 3,
                host: "discloud.app"
            },
            localhost: {
                shardList: [0, 1],
                totalShards: 2,
                host: "localhost"
            }
        }[env.MACHINE];
    }
}