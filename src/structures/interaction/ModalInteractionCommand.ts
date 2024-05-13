import { ModalSubmitInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import setPrefixes from "../../commands/components/modals/setprefix/prefix.set";
import reminder from "../../commands/components/modals/reminder/revalidate";
import searchAnime from "../../commands/functions/anime/search.anime";
import embed from "../../commands/functions/embed/modals";
import { QuizCharactersManager } from "../quiz";
import modalRedirect from "../stop/modal";

export default class ModalInteractionCommand extends BaseComponentInteractionCommand {
    declare interaction: ModalSubmitInteraction;

    constructor(interaction: ModalSubmitInteraction) {
        super(interaction);
    }

    async getFunctionAndExecute() {

        if (!this.isValid) return;
        const customData = this.customData;
        if (!customData.c) return;

        const execute = {
            "prefix": [setPrefixes, this.interaction, customData],
            "reminder": [reminder, this.interaction, customData],
            "anime_search": [searchAnime, this.interaction],
            "embed": [embed, this.interaction, customData],
            "quiz": [QuizCharactersManager.redirectFunctionByCustomID.bind(QuizCharactersManager), this.interaction, customData],
            "stop": [modalRedirect, this.interaction, customData]
        }[customData.c] as [(...args: any) => any, any];

        if (!execute || typeof execute[0] !== "function") return;
        return await execute[0](...execute.slice(1));
    }
}