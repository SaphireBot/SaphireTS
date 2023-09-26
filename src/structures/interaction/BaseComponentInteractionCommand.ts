import { AnySelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction, AutocompleteInteraction } from "discord.js";
import { BaseComponentCustomId } from "../../@types/customId";
type InteractionType = ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction | AutocompleteInteraction;

export default abstract class BaseComponentInteractionCommand {
    declare interaction: InteractionType;
 
    constructor(interaction: InteractionType) {
        this.interaction = interaction;
    }

    get isValid() {
        if (!("customId" in this.interaction)) return false;
        try {
            JSON.parse(this.interaction.customId);
            return true;
        } catch (er) {
            return false;
        }
    }

    getCustomData() {
        if (!("customId" in this.interaction)) return {} as BaseComponentCustomId;
        return JSON.parse(this.interaction.customId) as BaseComponentCustomId;
    }

}