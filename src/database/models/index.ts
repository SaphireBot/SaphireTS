import Guild from "./guild";
import User from "./user";
import Client from "./client";
import Blacklist from "./blacklist";

export default class Models {
    declare Guilds: typeof Guild;
    declare Users: typeof User;
    declare Client: typeof Client;
    declare Blacklist: typeof Blacklist;

    constructor() {
        this.Guilds = Guild;
        this.Users = User;
        this.Client = Client;
        this.Blacklist = Blacklist;
    }

}