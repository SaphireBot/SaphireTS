import { ButtonInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import defineLanguage from "../../commands/components/buttons/setlang/setlang.define";
import { slashCommands } from "../../commands";
import prefixConfigure from "../../commands/components/buttons/prefix";
import socket from "../../services/api/ws";

export default class ButtonInteractionCommand extends BaseComponentInteractionCommand {
    declare interaction: ButtonInteraction;

    constructor(interaction: ButtonInteraction) {
        super(interaction);
        // this.interaction = interaction;
    }

    async getFunctionAndExecute() {
        if (!this.isValid) return;
        const customData = this.getCustomData();
        console.log(customData);
        const execute = {
            "lang": [defineLanguage, this.interaction, customData],
            "ping": slashCommands.has("ping") ? [slashCommands.get("ping")?.additional?.execute, this.interaction, customData] : undefined,
            "prefix": [prefixConfigure, this.interaction, customData],
            "delete": [this.deleteMessage, this.interaction, customData]
        }[customData.c] as [(...args: any) => any, any];
        console.log(execute);
        if (execute && typeof execute[0] === "function")
            return execute[0](...execute.slice(1));

        return;
    }

    deleteMessage(interaction: ButtonInteraction, commandData: { uid?: string, reminderId?: string }) {

        if (interaction.user.id === commandData.uid) {
            interaction.message?.delete().catch(() => { });

            if (commandData.reminderId)
                socket?.send({ type: "removeReminder", id: commandData.reminderId });

            return;
        }

        if (interaction.user.id !== interaction.message.interaction?.user?.id) return;
        return interaction.message?.delete().catch(() => { });
    }
}