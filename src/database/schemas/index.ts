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
import { RaceSchema } from "./race";
import { Connect4Schema } from "./connnect4";
import { BattleroyalePhraseSchema, BattleroyaleSchema } from "./battleroyale";
import { CharacterSchema } from "./character";
import { VoteSchema } from "./votes";
import { LottoSchema } from "./lotto";
import { GiveawaySchema } from "./giveaway";

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
    RaceSchema = RaceSchema;
    Connect4Schema = Connect4Schema;
    BattleroyaleSchema = BattleroyaleSchema;
    BattleroyalePhraseSchema = BattleroyalePhraseSchema;
    CharacterSchema = CharacterSchema;
    VotesSchema = VoteSchema;
    LottoSchema = LottoSchema;
    GiveawaySchema = GiveawaySchema;

    constructor() { }

}