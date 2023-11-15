import Crash from "./crash/crash";
import Giveaway from "./giveaway/manager";
import Jokempo from "./jokempo/manager";
import Pay from "./pay/manager";
import Tempcall from "./tempcall/manager";
import Ban from "./ban/manager";
import Autorole from "./autorole/autorole";
import Reminder from "./reminder/manager";
import Afk from "./afk/index";

const GiveawayManager = new Giveaway();
const JokempoManager = new Jokempo();
const PayManager = new Pay();
const CrashManager = new Crash();
const TempcallManager = new Tempcall();
const BanManager = new Ban();
const AutoroleManager = new Autorole();
const ReminderManager = new Reminder();
const AfkManager = new Afk();

export {
    GiveawayManager,
    JokempoManager,
    PayManager,
    CrashManager,
    TempcallManager,
    BanManager,
    AutoroleManager,
    ReminderManager,
    AfkManager
};