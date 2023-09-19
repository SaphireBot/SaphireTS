import { ButtonInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import defineLanguage from "../../commands/components/buttons/setlang/setlang.define";
import { BaseComponentCustomId } from "../../@types/customId";

export default class ButtonInteractionCommand extends BaseComponentInteractionCommand {
    declare interaction: ButtonInteraction;

    constructor(interaction: ButtonInteraction) {
        super(interaction);
        this.interaction = interaction;
    }

    async getFunctionAndExecute() {
        if (!this.isValid) return;
        const customData = this.getCustomData();

        const execute = {
            "lang": [defineLanguage, this.interaction, customData]
        }[customData.c] as [(...args: any) => any, any];

        if (execute)
            return execute[0](...execute.slice(1));

        return;
    }

    getCustomData(): BaseComponentCustomId {
        return JSON.parse(this.interaction.customId);
    }
}