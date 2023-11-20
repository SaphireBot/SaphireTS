import { Guild, GuildTextBasedChannel, Message, StringSelectMenuInteraction, User } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import { baseCustomId } from "../../@types/selectmenu";
import twitchclips from "../../commands/components/selectmenu/twitch_clips";
import globalRanking from "../../commands/functions/ranking/global/ranking";

export default class SelectMenuInteraction extends BaseComponentInteractionCommand {
    declare interaction: StringSelectMenuInteraction;
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

        if (!this.isValid) return;

        const customData = this.customData as baseCustomId;
        const execute = this.getFunctionToExecute(customData.c);
        if (!execute) return;

        return await execute(this.interaction, customData);
    }

    getFunctionToExecute(commandRequest: string): any {
        return {
            "twitch": twitchclips,
            "ranking": globalRanking
        }[commandRequest];
    }
}