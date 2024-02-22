import { AutocompleteInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import { GiveawayManager } from "../../managers";
import color from "./autocomplete/color";
import timeOptions from "./autocomplete/timeOptions";
import balance from "./autocomplete/balance";
import message_history from "./autocomplete/message_history";
import roles from "./autocomplete/roles";
import streamer from "./autocomplete/streamers";
import ban from "./autocomplete/ban";
import language from "./autocomplete/language";
import gif from "./autocomplete/gif";
import { GuildsCached } from "../../saphire/client";

export default class Autocomplete extends BaseComponentInteractionCommand {
    declare interaction: AutocompleteInteraction;

    constructor(interaction: AutocompleteInteraction) {
        super(interaction);
        this.interaction = interaction;
    }

    async getCommandAndExecute() {
        const { name, value } = this.interaction.options.getFocused(true);

        if (["unban"].includes(this.interaction.commandName))
            return await this.isByCommandName(this.interaction.commandName, value);

        if (["serverinfo"].includes(this.interaction.commandName))
            return await this.searchServerById(value);

        switch (name) {
            case "streamer": streamer(this.interaction, value); break;
            case "giveaway": GiveawayManager.autocomplete(this.interaction, value); break;
            case "color": color(this.interaction, value); break;
            case "time": timeOptions(this.interaction, value); break;
            case "amount": balance(this.interaction, value); break;
            case "message_history": message_history(this.interaction, value); break;
            case "roles": roles(this.interaction, value); break;
            case "language": language(this.interaction, value); break;
            case "gif": gif(this.interaction, value); break;

            default:
                await this.interaction.respond([]);
                break;
        }

    }

    async isByCommandName(commandName: string, value: string) {
        switch (commandName) {
            case "ban": ban(this.interaction as any, value); break;
            default:
                await this.interaction.respond([]);
                break;
        }
    }

    async searchServerById(value: string | null) {

        const search = value?.toLowerCase() || "";
        if (!GuildsCached || !GuildsCached?.length) return await this.interaction.respond([]);

        const fill = value?.length
            ? GuildsCached.filter(guild => guild?.name?.toLowerCase()?.includes(search) || guild?.id?.includes(search))
            : GuildsCached;

        return await this.interaction.respond(
            fill
                .map(guild => ({ name: guild.name, value: guild.id }))
                .filter(v => v.name && v.value)
                .slice(0, 25)
        );

    }
}