import { AutocompleteInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import { GiveawayManager } from "../../managers";
import color from "./autocomplete/color";
import timeOptions from "./autocomplete/timeOptions";

export default class Autocomplete extends BaseComponentInteractionCommand {
    declare interaction: AutocompleteInteraction;

    constructor(interaction: AutocompleteInteraction) {
        super(interaction);
        this.interaction = interaction;
    }

    async getCommandAndExecute() {
        const { name, value } = this.interaction.options.getFocused(true);
        if (name === "giveaway") return GiveawayManager.autocomplete(this.interaction, value);
        if (name === "color") return color(this.interaction, value);
        if (name === "time") return timeOptions(this.interaction, value);
    }
}