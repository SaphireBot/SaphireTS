import { ChatInputCommandInteraction, Routes } from "discord.js";
import { e } from "../../util/json";
import { slashCommands } from "../../commands";
import client from "../../saphire";
import unhandledRejection from "../../process/unhandledRejection";
import errorControl from "../../commands/errors/error.control";

export default class ChatInput {
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
            content: `${e.Animated.SaphireCry} | Infelizmente, o comando \`${block.cmd}\` está bloqueado.\n${e.bug} | \`${block.error}\``,
            ephemeral: true
        });
    }

    async getCommandAndExecute() {

        const command = slashCommands.get(this.interaction.commandName);

        if (!command) {
            console.log("Slash Command not found", this.interaction.commandName);
            await this.interaction.reply({
                content: `${e.Animated.SaphirePanic} | Esse comando não foi encontrado.`,
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