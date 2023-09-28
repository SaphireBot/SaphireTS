import { ChatInputCommandInteraction, Routes } from "discord.js";
import { e } from "../../util/json";
import { slashCommands } from "../../commands";
import client from "../../saphire";
import errorControl from "../../commands/errors/error.control";
import { t } from "../../translator";

export default class ChatInputInteractionCommand {
    declare interaction: ChatInputCommandInteraction;

    constructor(interaction: ChatInputCommandInteraction) {
        this.interaction = interaction;
    }

    async isBlocked(commandName: string) {
        const data = await client.getData();
        const block = data?.ComandosBloqueadosSlash.find(c => c.cmd === commandName);
        if (block?.cmd && block?.error) {
            this.notifyCommandBlock(block);
            return true;
        }
        return false;
    }

    async notifyCommandBlock(block: { cmd?: string, error?: string }) {
        return await this.interaction.reply({
            content: t("System_the_command_is_block", {
                locale: this.interaction.userLocale,
                e,
                block
            }).limit("MessageContent"),
            ephemeral: true
        });
    }

    async getCommandAndExecute() {

        const command = slashCommands.get(this.interaction.commandName);

        if (!command) {
            console.log("Slash Command not found", this.interaction.commandName);
            await this.interaction.reply({
                content: t("System_command_not_found", {
                    locale: this.interaction.userLocale,
                    e,
                }),
                ephemeral: true
            });
            if (client.user?.id)
                return await client.rest.delete(
                    Routes.applicationCommand(client.user?.id, this.interaction.commandId)
                ).catch(() => { });
            return;
        }

        if (await this.isBlocked(this.interaction.commandName)) return;

        return command.additional.execute(this.interaction)
            .catch(err => errorControl(this.interaction, err));

    }
}