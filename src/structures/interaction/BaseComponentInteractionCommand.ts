import { AnySelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction } from "discord.js";

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

}