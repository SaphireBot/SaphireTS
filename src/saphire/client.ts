import { saphireClientOptions } from "../util/client";
import { Client } from "discord.js";
import { env } from "process";
import Database from "../database";

export default class Saphire extends Client {
    declare shardId: number;
    declare clusterName: string;
    declare interactions: number;
    declare messages: number;
    declare commandsUsed: Record<string, number>;
    declare restart: boolean;

    constructor() {
        super(saphireClientOptions);
        this.clusterName = "Gargantua";
        this.interactions = 0;
        this.messages = 0;
        this.commandsUsed = {};
    }

    start() {
        super.login();
        const machine = env.MACHINE;
        const clusterName = { discloud: "Bellatrix", localhost: "Gargantua" }[machine] || "Antares";
        this.clusterName = clusterName;
        return;
    }

    async getData() {
        return await Database.getClientData();
    }

    
}