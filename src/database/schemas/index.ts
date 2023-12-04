import { GuildSchema } from "./guild";
import { UserSchema } from "./user";
import { ClientSchema } from "./client";
import { BlacklistSchema } from "./blacklist";
import { JokempoSchema } from "./jokempo";
import { PaySchema } from "./pay";
import { CrashSchema } from "./crash";
import { TwitchSchema } from "./twitch";
import { ReminderSchema } from "./reminder";
import { CommandSchema } from "./command";
import { AfkSchema } from "./afk";
import { VoteSchema } from "./vote";

export default class Schemas {
    GuildSchema = GuildSchema;
    UserSchema = UserSchema;
    ClientSchema = ClientSchema;
    BlacklistSchema = BlacklistSchema;
    JokempoSchema = JokempoSchema;
    PaySchema = PaySchema;
    CrashSchema = CrashSchema;
    TwitchSchema = TwitchSchema;
    ReminderSchema = ReminderSchema;
    CommandSchema = CommandSchema;
    AfkSchema = AfkSchema;
    VoteSchema = VoteSchema;

    constructor() { }

}