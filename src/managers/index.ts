import Crash from "./crash/crash";
import Giveaway from "./giveaway/manager";
import Jokempo from "./jokempo/manager";
import Pay from "./pay/manager";
import Tempcall from "./tempcall/manager";
const GiveawayManager = new Giveaway();
const JokempoManager = new Jokempo();
const PayManager = new Pay();
const CrashManager = new Crash();
const TempcallManager = new Tempcall();

export {
    GiveawayManager,
    JokempoManager,
    PayManager,
    CrashManager,
    TempcallManager
};