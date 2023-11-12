import { ChatInputCommandInteraction, Routes } from "discord.js";
import { e } from "../../util/json";
import { slashCommands } from "../../commands";
import client from "../../saphire";
import errorControl from "../../commands/errors/error.control";
import { t } from "../../translator";
import Database from "../../database";

export default class ChatInputInteractionCommand {
    declare interaction: ChatInputCommandInteraction;

    constructor(interaction: ChatInputCommandInteraction) {
        this.interaction = interaction;
    }

    async isBlocked(commandName: string) {
        const data = await Database.getClientData();
        const block = data?.BlockedCommands.find(c => c.cmd === commandName);
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

        if (command.additional.building)
            return await this.interaction.reply({
                content: "system.commands.isBuilding_cannot_use_this_command"
            });

        if (await this.isBlocked(this.interaction.commandName)) return;

        client.commandsUsed[command.data.name]++;
        this.save(command.data.name);
        return command.additional.execute(this.interaction)
            .catch(err => errorControl(this.interaction, err));

    }

    async save(commandName: string) {
        await Database.Client.updateOne(
            { id: client.user!.id },
            { $inc: { ComandosUsados: 1 } }
        );

        await Database.Commands.updateOne(
            { id: commandName },
            {
                $inc: { count: 1 },
                $push: {
                    usage: {
                        guildId: this.interaction.guildId || "DM",
                        userId: this.interaction.user.id,
                        channelId: this.interaction.channelId || "DM",
                        type: "SlashCommand",
                        date: new Date()
                    }
                }
            },
            { upsert: true }
        );

        return;
    }
}