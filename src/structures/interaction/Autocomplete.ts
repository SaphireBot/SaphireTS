import { AutocompleteInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import { GiveawayManager } from "../../managers";
import color from "./autocomplete/color";
import timeOptions from "./autocomplete/timeOptions";
import balanceAmount from "./autocomplete/balanceAmount";
import message_history from "./autocomplete/message_history";
import roles from "./autocomplete/roles";
import streamer from "./autocomplete/streamers";

export default class Autocomplete extends BaseComponentInteractionCommand {
    declare interaction: AutocompleteInteraction;

    constructor(interaction: AutocompleteInteraction) {
        super(interaction);
        this.interaction = interaction;
    }

    async getCommandAndExecute() {
        const { name, value } = this.interaction.options.getFocused(true);

        switch (name) {
            case "streamer": streamer(this.interaction, value); break;
            case "giveaway": GiveawayManager.autocomplete(this.interaction, value); break;
            case "color": color(this.interaction, value); break;
            case "time": timeOptions(this.interaction, value); break;
            case "amount": balanceAmount(this.interaction, value); break;
            case "message_history": message_history(this.interaction, value); break;
            case "roles": roles(this.interaction, value); break;

            default:
                await this.interaction.respond([]);
                break;
        }

    }
}