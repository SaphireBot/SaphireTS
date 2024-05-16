import { saphireClientOptions } from "../util/client";
import { Client, Routes, Guild, APIGuild, APIUser } from "discord.js";
import { env } from "process";
import Database from "../database";

export default class Saphire extends Client {

    defaultPrefixes = ["s!", "-"];
    defaultLocale = "pt-BR";
    declare invite: string;
    declare shardId: number;
    declare interactions: number;
    declare messages: number;
    declare commandsUsed: Record<string, number>;
    declare restart: boolean;
    declare loaded: boolean;
    declare blacklisted: Set<string>;
    declare clusterName: string;

    constructor() {
        super(saphireClientOptions);
        this.clusterName = "Gargantua";
        this.interactions = 0;
        this.messages = 0;
        this.commandsUsed = {};
        this.loaded = false;
        this.blacklisted = new Set<string>();
    }

    async start() {
        super.login(
            env.MACHINE === "discloud"
                ? env.SAPHIRE_DISCORD_TOKEN
                : env.CANARY_DISCORD_TOKEN
        );

        const clusterName = {
            discloud: "Bellatrix",
            localhost: "Gargantua"
        }[env.MACHINE] || "Antares";

        this.clusterName = clusterName;
        return;
    }

    getData = async () => await Database.getClientData();

    async getGuild(guildId?: string): Promise<Guild | undefined> {
        if (!guildId || guildId?.includes(" ") || isNaN(Number(guildId))) return;

        if (this.guilds.cache.has(guildId))
            return this.guilds.cache.get(guildId)!;

        const data = await this.guilds.fetch(guildId).catch(() => null);
        if (data) return data;

        const forceGuildFetch = await this.guilds.fetch(guildId)
            .catch(async () => {
                const data = await fetch(
                    `https://discord.com/api/v10/guilds/${guildId}`,
                    {
                        headers: { authorization: `Bot ${this.token}` },
                        method: "GET"
                    }
                )
                    .then(res => res.json())
                    .catch(() => null) as APIGuild | null;

                if (data?.id)
                    // @ts-expect-error ignore
                    return new Guild(client, data) as Guild;
                return null;
            });

        if (forceGuildFetch) return forceGuildFetch;
        return undefined;
    }

    async getUser(userId: string): Promise<APIUser | undefined> {

        const cache = await Database.UserCache.json.get(userId);
        if (cache) return (cache as any) as APIUser;

        const data = await this.rest.get(Routes.user(userId))
            .then(user => {
                Database.setCache((user as any)?.id, user, "user");
                return user as APIUser;
            })
            .catch(() => undefined) as APIUser | undefined;

        return data;
    }

    async getUsers(usersId: string[]): Promise<APIUser[]> {
        const users = await Promise.all(usersId.map(this.getUser.bind(this)));
        return users.filter(Boolean) as APIUser[];
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
