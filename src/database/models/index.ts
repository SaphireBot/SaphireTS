import Guild from "./guild";
import User from "./user";
import Client from "./client";
import Blacklist from "./blacklist";
import Jokempo from "./jokempo";
import Pay from "./pay";
import Crash from "./crash";
import Twitch from "./twitch";
import Reminder from "./reminder";
import Command from "./command";
import Afk from "./afk";

export default class Models {
    declare Guilds: typeof Guild;
    declare Users: typeof User;
    declare Client: typeof Client;
    declare Blacklist: typeof Blacklist;
    declare Jokempo: typeof Jokempo;
    declare Pay: typeof Pay;
    declare Crash: typeof Crash;
    declare Twitch: typeof Twitch;
    declare Reminders: typeof Reminder;
    declare Commands: typeof Command;
    declare Afk: typeof Afk;

    constructor() {
        this.Guilds = Guild;
        this.Users = User;
        this.Client = Client;
        this.Blacklist = Blacklist;
        this.Jokempo = Jokempo;
        this.Pay = Pay;
        this.Crash = Crash;
        this.Twitch = Twitch;
        this.Reminders = Reminder;
        this.Commands = Command;
        this.Afk = Afk;
    }

}