import defineLanguage from "../../commands/components/buttons/setlang/setlang.define";
import prefixConfigure from "../../commands/components/buttons/prefix";
import giveawayButton from "../../commands/components/buttons/giveaway";
import jokempo from "../../commands/components/buttons/jokempo";
import payValidate from "../../commands/components/buttons/pay/payValidate";
import crashBet from "../../commands/components/buttons/crash";
import tempcall from "../../commands/components/buttons/tempcall";
import dropclips from "../../commands/components/buttons/twitch/dropclips";
import reminder from "../../commands/components/buttons/reminder";
import connect4 from "../../commands/components/buttons/connect4";
import clear from "../../commands/functions/clear/clear";
import vote from "../../commands/components/vote/buttons";
import memoryCheck from "../../commands/components/buttons/memory/check";
import history from "../../commands/components/buttons/history";
import roles from "../../commands/functions/serverinfo/roles";
import indications from "../../commands/functions/anime/indications.anime";
import embed from "../../commands/functions/embed/buttons";
import removeGuild from "../../commands/functions/admin/removeguild";
import buttonsPearl from "../../commands/functions/pearl/buttons.pearl";
import { redirect as emojis } from "../../commands/functions/emojis";
import { validateMercadoPagoIDButtons } from "../payment";
import { QuizCharactersManager } from "../quiz";
import reply from "../stop/reply";
import buttonsGlass from "../glass/buttons";
import buttonTeam from "../../commands/functions/teams/button.teams";
import buttonImage from "../../commands/functions/images/button.images";
import pigStatus from "../../commands/functions/pig/status";
import eliminationClick from "../../commands/functions/elimination/click";

const functionsKeys: Record<string, any> = {
  "lang": defineLanguage,
  "prefix": prefixConfigure,
  "giveaway": giveawayButton,
  "jkp": jokempo,
  "pay": payValidate,
  "crash": crashBet,
  "tempcall": tempcall,
  "twitch": dropclips,
  "rmd": reminder,
  "clear": clear,
  "vote": vote,
  "memory": memoryCheck,
  "history": history,
  "sinfo": roles,
  "connect": connect4,
  "ind_anime": indications,
  "embed": embed,
  "removeGuild": removeGuild,
  "mpg": validateMercadoPagoIDButtons,
  "quiz": QuizCharactersManager.redirectFunctionByCustomID.bind(QuizCharactersManager),
  "emojis": emojis,
  "pearl": buttonsPearl,
  "stop": reply,
  "glass": buttonsGlass,
  "teams": buttonTeam,
  "images": buttonImage,
  "pig": pigStatus,
  "elimination": eliminationClick
};

const functions = new Map<string, any>();

for (const [key, func] of Object.entries(functionsKeys))
  functions.set(key, func);

export default functions;