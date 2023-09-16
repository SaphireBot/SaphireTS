import Guild from "./guild";

export default class Models {
    declare Guilds: typeof Guild

    constructor() {
        this.Guilds = Guild
    }

}