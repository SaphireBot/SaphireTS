import { AnySelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { BaseComponentCustomId } from "../../@types/customId";

export default abstract class BaseComponentInteractionCommand {
    declare interaction: ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction;
 
    constructor(interaction: ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction) {
        this.interaction = interaction;
    }

    get isValid() {
        try {
            JSON.parse(this.interaction.customId);
            return true;
        } catch (er) {
            return false;
        }
    }

    getCustomData() {
        return JSON.parse(this.interaction.customId) as BaseComponentCustomId;
    }

}