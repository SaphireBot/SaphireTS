import { Guild, GuildTextBasedChannel, Message, StringSelectMenuInteraction, User } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import { baseCustomId } from "../../@types/selectmenu";
import twitchclips from "../../commands/components/selectmenu/twitch_clips";
import globalRanking from "../../commands/functions/ranking/global/ranking";
import analiseJokempo from "../../commands/components/buttons/jokempo";
import translateAnime from "../../commands/functions/anime/translate.anime";
import translateManga from "../../commands/functions/anime/translate.manga";
import history from "../../commands/components/buttons/history";
import redirect from "../../commands/functions/serverinfo/redirect";
import display from "../../commands/functions/anime/display.indications";

export default class SelectMenuInteraction extends BaseComponentInteractionCommand {
    declare interaction: StringSelectMenuInteraction<"cached">;
    declare customId: string;
    declare values: string[];
    declare value: string;
    declare message: Message<true>;
    declare user: User;
    declare guild: Guild;
    declare channel: GuildTextBasedChannel | null;

    constructor(interaction: StringSelectMenuInteraction<"cached">) {
        super(interaction);
        this.customId = interaction.customId;
        this.message = interaction.message;
        this.user = interaction.user;
        this.guild = interaction.guild;
        this.channel = interaction.channel;
        this.values = interaction.values;
        this.value = interaction.values[0];
    }

    async filterAndChooseFunction() {

        if (!this.isValid) {

            switch (this.customId) {
                case "jkp": analiseJokempo(this.interaction, JSON.parse(this.value)); break;
                case "history": history(this.interaction, JSON.parse(this.value) as any); break;

                default:
                    break;
            }

            return;
        }

        const customData = this.customData as baseCustomId;
        const execute = this.getFunctionToExecute(customData.c);
        if (!execute) return;

        return await execute(this.interaction, customData);
    }

    getFunctionToExecute(commandRequest: string): any {
        return {
            "twitch": twitchclips,
            "ranking": globalRanking,
            "animeChoosen": translateAnime,
            "mangaChoosen": translateManga,
            "serverinfo": redirect,
            "anime": display
        }[commandRequest];
    }
}