import { MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from "discord.js";
import handler from "../commands/handler";

export default class ContextMenuCommand {
  declare interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction;
  declare commandName: string;

  constructor(interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction) {
    this.interaction = interaction;
  }

  async getCommandAndExecute() {
    const command = handler.getMessageContextMenuCommand(this.interaction.commandName);
    if (!command) return;
    if ("execute" in command.additional && typeof command.additional.execute === "function")
      return await command.additional.execute(this.interaction);
  }

}