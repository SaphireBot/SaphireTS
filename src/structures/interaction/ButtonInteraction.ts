import { ButtonInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import defineLanguage from "../../commands/components/buttons/setlang/setlang.define";
import { slashCommands } from "../../commands";
import prefixConfigure from "../../commands/components/buttons/prefix";
import socket from "../../services/api/ws";
import giveawayButton from "../../commands/components/buttons/giveaway";
import jokempo from "../../commands/components/buttons/jokempo";
import payValidate from "../../commands/components/buttons/pay/payValidate";
import crashBet from "../../commands/components/buttons/crash";
import tempcall from "../../commands/components/buttons/tempcall";
import dropclips from "../../commands/components/buttons/twitch/dropclips";
import reminder from "../../commands/components/buttons/reminder";
import connect4 from "../../commands/components/buttons/connect4";
import clear from "../../commands/functions/clear/clear";
import vote from "../../commands/components/vote/cancel";
import memoryCheck from "../../commands/components/buttons/memory/check";
import history from "../../commands/components/buttons/history";
import roles from "../../commands/functions/serverinfo/roles";
import modals from "../modals";
import { t } from "../../translator";
import { e } from "../../util/json";
import indications from "../../commands/functions/anime/indications.anime";
import searchAnime from "../../commands/functions/anime/search.anime";
import embed from "../../commands/functions/embed/buttons";
import serverinfo from "../../commands/functions/serverinfo";
import removeGuild from "../../commands/functions/admin/removeguild";

export default class ButtonInteractionCommand extends BaseComponentInteractionCommand {
    declare interaction: ButtonInteraction;

    constructor(interaction: ButtonInteraction) {
        super(interaction);
    }

    async getFunctionAndExecute() {
        if (!this.isValid) return;
        const customData = this.customData;

        const execute = {
            "lang": [defineLanguage, this.interaction, customData],
            "ping": slashCommands.has("ping") ? [slashCommands.get("ping")?.additional?.execute, this.interaction, customData] : undefined,
            "prefix": [prefixConfigure, this.interaction, customData],
            "delete": [this.deleteMessage, this.interaction, customData],
            "giveaway": [giveawayButton, this.interaction, customData],
            "jkp": [jokempo, this.interaction, customData],
            "pay": [payValidate, this.interaction, customData],
            "crash": [crashBet, this.interaction, customData],
            "tempcall": [tempcall, this.interaction, customData],
            "twitch": [dropclips, this.interaction, customData],
            "rmd": [reminder, this.interaction, customData],
            "botinfo": slashCommands.has("botinfo") ? [slashCommands.get("botinfo")?.additional?.execute, this.interaction, customData] : undefined,
            "clear": [clear, this.interaction, customData],
            "vote": [vote, this.interaction, customData],
            "memory": [memoryCheck, this.interaction, customData],
            "history": [history, this.interaction, customData],
            "sinfo": [roles, this.interaction, undefined, customData],
            "connect": [connect4, this.interaction, customData],
            "search_anime": [this.showAnimeSearchModal, this.interaction],
            "s_anime": [searchAnime, this.interaction, true],
            "ind_anime": [indications, this.interaction],
            "embed": [embed, this.interaction, customData],
            "serverinfo": [serverinfo, this.interaction, [], false],
            "removeGuild": [removeGuild, this.interaction, customData]
        }[customData.c] as [(...args: any) => any, any];

        if (execute && typeof execute[0] === "function")
            return await execute[0](...execute.slice(1));

        return;
    }

    async showAnimeSearchModal(int: ButtonInteraction<"cached">) {

        if ((JSON.parse(int.customId))?.uid !== int.user.id)
            return await int.reply({
                content: t("tempcall.you_cannot_click_here", { e, locale: int.userLocale }),
                ephemeral: true
            });

        return await int.showModal(modals.searchAnime(int.userLocale));
    }

    async deleteMessage(interaction: ButtonInteraction, commandData: { uid?: string, reminderId?: string }) {

        if (interaction.user.id === commandData.uid) {
            await interaction.message?.delete().catch(() => { });

            if (commandData.reminderId)
                socket.send({ type: "removeReminder", id: commandData.reminderId });

            return;
        }

        if (interaction.user.id !== interaction.message.interaction?.user?.id) return;
        return await interaction.message?.delete().catch(() => { });
    }
}