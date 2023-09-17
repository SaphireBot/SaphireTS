import Guild from "./guild";
import User from "./user";
import Client from "./client";

export default class Models {
    declare Guilds: typeof Guild;
    declare Users: typeof User;
    declare Client: typeof Client;

    constructor() {
        this.Guilds = Guild;
        this.Users = User;
        this.Client = Client;
    }

}