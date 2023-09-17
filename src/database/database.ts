import { connect, set } from "mongoose";
import Models from "./models";
import socket from "../services/api/ws";
import client from "../saphire";
import { ClientSchema } from "./models/client";

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
        if (
            guildData?.Prefixes
            && Array.isArray(guildData?.Prefixes)
            && (guildData?.Prefixes?.length || 0) > 0
        )
            this.prefixes.set(guildId, guildData?.Prefixes);
        else this.prefixes.set(guildId, ["s!", "-"]);

        return this.prefixes.get(guildId) || ["s!", "-"];
    }

    async getGuild(guildId: string) {
        const data = await socket.getGuild(guildId);
        if (data) return data;

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

    async getClientData(): Promise<ClientSchema | undefined> {
        const data = await socket.getClientData();
        if (data) return data;

        const guildData = await this.Client.findOne({ id: client.user?.id });
        if (!guildData) {
            const doc = new this.Guilds({ id: client.user?.id });
            const data = await doc.save()?.then(doc => doc.toObject()).catch(err => console.log(err));
            return data as ClientSchema | undefined;
        }

        return guildData.toObject();
    }

}
