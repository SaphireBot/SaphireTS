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
import clear from "../../commands/functions/clear/clear";
import vote from "../../commands/components/vote/cancel";

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
            "vote": [vote, this.interaction, customData]
        }[customData.c] as [(...args: any) => any, any];

        if (execute && typeof execute[0] === "function")
            return await execute[0](...execute.slice(1));

        return;
    }

    async deleteMessage(interaction: ButtonInteraction, commandData: { uid?: string, reminderId?: string }) {

        if (interaction.user.id === commandData.uid) {
            await interaction.message?.delete().catch(() => { });

            if (commandData.reminderId)
                socket?.send({ type: "removeReminder", id: commandData.reminderId });

            return;
        }

        if (interaction.user.id !== interaction.message.interaction?.user?.id) return;
        return await interaction.message?.delete().catch(() => { });
    }
}