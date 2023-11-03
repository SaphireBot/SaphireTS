import { ModalSubmitInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import setPrefixes from "../../commands/components/modals/setprefix/prefix.set";

export default class ModalInteractionCommand extends BaseComponentInteractionCommand {
    declare interaction: ModalSubmitInteraction;

    constructor(interaction: ModalSubmitInteraction) {
        super(interaction);
    }

    async getFunctionAndExecute() {

        if (!this.isValid) return;
        const customData = this.customData;
        if (!customData.c) return;

        const execute = {
            "prefix": [setPrefixes]
        }[customData.c] as [(...args: any) => any, any];

        if (!execute || typeof execute[0] !== "function") return;
        return execute[0](this.interaction, customData);
    }
}