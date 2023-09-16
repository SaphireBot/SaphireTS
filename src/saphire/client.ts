import { saphireClientOptions } from "../util/client";
import { Client } from "discord.js";

export default class Saphire extends Client {
    declare shardId: number;

    constructor() {
        super(saphireClientOptions);
    }

}