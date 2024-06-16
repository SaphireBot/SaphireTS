import { ButtonInteraction } from "discord.js";
import BaseComponentInteractionCommand from "./BaseComponentInteractionCommand";
import socket from "../../services/api/ws";
import modals from "../modals";
import { t } from "../../translator";
import { e } from "../../util/json";
import searchAnime from "../../commands/functions/anime/search.anime";
import serverinfo from "../../commands/functions/serverinfo";
import functions from "./buttons.functions";

export default class ButtonInteractionCommand extends BaseComponentInteractionCommand {
    declare interaction: ButtonInteraction;

    constructor(interaction: ButtonInteraction) {
        super(interaction);
    }

    async getFunctionAndExecute() {
        if (!this.isValid) return;
        const customData = this.customData;

        const cmd = functions.get(customData.c);
        if (cmd && typeof cmd === "function")
            return await cmd(this.interaction, customData);

        const execute = {
            "s_anime": [searchAnime, this.interaction, true],
            "search_anime": [this.showAnimeSearchModal, this.interaction],
            "serverinfo": [serverinfo, this.interaction, [], false],
            "delete": [this.deleteMessage, this.interaction, customData]
        }[customData.c] as [(...args: any) => any, any];

        if (execute && typeof execute[0] === "function")
            return await execute[0](...execute.slice(1));

        return;
    }

    async showAnimeSearchModal(int: ButtonInteraction<"cached">) {

        if ((JSON.parse(int.customId))?.uid !== int.user.id)
            return await int.reply({
                content: t("tempcall.you_cannot_click_here", { e, locale: int.userLocale }),
                ephemeral: true
            });

        return await int.showModal(modals.searchAnime(int.userLocale));
    }

    async deleteMessage(interaction: ButtonInteraction, commandData: { uid?: string, reminderId?: string }) {

        if (interaction.user.id === commandData.uid) {
            await interaction.message?.delete().catch(() => { });

            if (commandData.reminderId)
                socket.send({ type: "removeReminder", id: commandData.reminderId });

            return;
        }

        if (interaction.user.id !== interaction.message.interaction?.user?.id) return;
        return await interaction.message?.delete().catch(() => { });
    }

}