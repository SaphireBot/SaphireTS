import { ModalSubmitInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import setPrefixes from "../../commands/components/modals/setprefix/prefix.set";

export default class ModalInteractionCommand extends BaseComponentInteractionCommand {
    declare interaction: ModalSubmitInteraction;

    constructor(interaction: ModalSubmitInteraction) {
        super(interaction);
        // this.interaction = interaction;
    }

    async getFunctionAndExecute() {

        if (!this.isValid) return;
        const customData = this.getCustomData();
        if (!customData.c) return;

        const execute = (<Record<string, [(...args: any[]) => Promise<any>, ...args: any[]]>>{
            "prefix": [setPrefixes]
        })[customData.c];

        if (!execute || typeof execute[0] !== "function") return;
        return execute[0](this.interaction, customData);
    }
}