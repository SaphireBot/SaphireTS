import Crash from "./crash/manager";
import Giveaway from "./giveaway/manager";
import Jokempo from "./jokempo/manager";
import Pay from "./pay/manager";
import Tempcall from "./tempcall/manager";
import Ban from "./tempban/manager";
import Autorole from "./autorole/manager";
import Reminder from "./reminder/manager";
import Afk from "./afk/manager";
import Ranking from "./ranking/manager";
import TopGG from "./topgg/manager";
import PPearlsManager from "./pearls/manager";
import Lotto from "./lotto/manager";
import GlobalSystemNotification from "./gsn/manager";
import MysticalTravelingChest from "./MysticalTravelingChest/manager";

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
const TopGGManager = new TopGG();
const PearlsManager = new PPearlsManager();
const LottoManager = new Lotto();
const GSNManager = new GlobalSystemNotification();
const MTCManager = new MysticalTravelingChest();

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
    RankingManager,
    TopGGManager,
    PearlsManager,
    LottoManager,
    GSNManager,
    MTCManager,
};