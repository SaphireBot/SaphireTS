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
import command from "./autocomplete/command";
import socket from "../../services/api/ws";
import quizOptions from "./autocomplete/quizOptions";
import remindersAutocomplete from "./autocomplete/reminders";
import letter from "./autocomplete/letter";
let GuildsCached: { name: string, id: string }[] = [];

export default class Autocomplete extends BaseComponentInteractionCommand {
    declare interaction: AutocompleteInteraction;

    constructor(interaction: AutocompleteInteraction) {
        super(interaction);
        this.interaction = interaction;
    }

    async getCommandAndExecute() {
        const { name, value } = this.interaction.options.getFocused(true);

        if (name === "language")
            return await language(this.interaction, value);

        if (this.interaction.commandName === "quiz")
            return await quizOptions(this.interaction, value || "", name as any);

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
            case "command": command(this.interaction, value); break;
            case "reminder": remindersAutocomplete(this.interaction, value); break;
            case "letter": letter(this.interaction, value); break;

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

        if (!GuildsCached.length) {
            GuildsCached = await socket.ws.timeout(2000)?.emitWithAck("getAllGuilds", "get").catch(() => []) as { name: string, id: string }[];
            if (GuildsCached.length) {
                setTimeout(() => GuildsCached = [], (1000 * 60) * 5);
            }
        }

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