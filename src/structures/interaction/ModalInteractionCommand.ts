import { ModalSubmitInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import setPrefixes from "../../commands/components/modals/setprefix/prefix.set";
import reminder from "../../commands/components/modals/reminder/revalidate";

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
            "prefix": [setPrefixes],
            "reminder": [reminder]
        }[customData.c] as [(...args: any) => any, any];

        if (!execute || typeof execute[0] !== "function") return;
        return execute[0](this.interaction, customData);
    }
}