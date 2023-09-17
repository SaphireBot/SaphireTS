import { connect, set } from "mongoose";
import Models from "./models";
import socket from "../services/api/ws";
import { GuildSchema } from "./models/guild";

export default class Database extends Models {
    prefixes = new Map<string, string[]>();

    constructor() {
        super();
    }

    async connect() {
        set("strictQuery", true);
        return await connect(process.env.DATABASE_LINK_CONNECTION)
            .then(() => this.getGuild("1081323090199445555"))
            .catch(err => {
                console.log("Mongoose Database | FAIL!\n--> " + err);
                return process.exit(12);
            });
    }

    async getPrefix(guildId: string) {
        const prefix = this.prefixes.get(guildId);
        if (prefix) return prefix;

        const guildData = await this.getGuild(guildId);
        this.prefixes.set(guildId, guildData?.Prefixes?.length ? guildData?.Prefixes : ["s!", "-"]);
        return guildData?.Prefixes || ["s!", "-"];
    }

    async getGuild(guildId: string) {
        const data = await socket.getGuild(guildId);
        if (data) return data as GuildSchema;

        const guildData = await this.Guilds.findOne({ id: guildId });
        if (!guildData)
            return new this.Guilds({ id: guildId })
                .save()
                .then(doc => doc.toObject())
                .catch(err => {
                    console.log(err);
                    return;
                });

        return guildData.toObject();
    }

}
