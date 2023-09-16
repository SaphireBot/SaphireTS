import Mongoose, { connect } from "mongoose";
import Models from "./models";
import { GuildModelType } from "../@types/models";

export default class Database extends Models {
    prefixes = new Map<string, string[]>();

    constructor() {
        super();
    }

    async connect() {
        Mongoose.set("strictQuery", true);
        return await connect(process.env.DATABASE_LINK_CONNECTION)
            .catch(err => {
                console.log("Mongoose Database | FAIL!\n--> " + err);
                return process.exit(12);
            });
    }

    async getPrefix(guildId: string) {
        const prefix = this.prefixes.get(guildId);
        if (prefix) return prefix;

        const guildData = await this.getGuild(guildId);
        this.prefixes.set(guildId, guildData?.Prefixes || ["s!", "-"]);
        return this.prefixes.get(guildId);
    }

    async getGuild(guildId: string): Promise<GuildModelType | null> {
        const data = await this.Guilds.findOne({ id: guildId });
        return data?.toObject() as GuildModelType;
    }
}
