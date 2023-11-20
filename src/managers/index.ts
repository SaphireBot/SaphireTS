import Crash from "./crash/manager";
import Giveaway from "./giveaway/manager";
import Jokempo from "./jokempo/manager";
import Pay from "./pay/manager";
import Tempcall from "./tempcall/manager";
import Ban from "./ban/manager";
import Autorole from "./autorole/manager";
import Reminder from "./reminder/manager";
import Afk from "./afk/manager";
import Ranking from "./ranking/manager";

const GiveawayManager = new Giveaway();
const JokempoManager = new Jokempo();
const PayManager = new Pay();
const CrashManager = new Crash();
const TempcallManager = new Tempcall();
const BanManager = new Ban();
const AutoroleManager = new Autorole();
const ReminderManager = new Reminder();
const AfkManager = new Afk();
const RankingManager = new Ranking();

export {
    GiveawayManager,
    JokempoManager,
    PayManager,
    CrashManager,
    TempcallManager,
    BanManager,
    AutoroleManager,
    ReminderManager,
    AfkManager,
    RankingManager
};