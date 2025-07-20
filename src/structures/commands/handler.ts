import { readdirSync } from "fs";
import { Command_Api_Data, ContextMenuBody, PrefixCommandType, SlashCommandType, appCommand } from "../../@types/commands";
import client from "../../saphire";
import { Message, Routes } from "discord.js";
import socket from "../../services/api/ws";
import { e } from "../../util/json";
import { PermissionsTranslate } from "../../util/constants";
import Database from "../../database";
import { env } from "process";
import { getLocalizations } from "../../util/getlocalizations";
import functions from "../interaction/buttons/buttons.functions";
import Experience from "../../managers/experience/experience";
const tags = { "1": "slash", "2": "apps", "3": "apps", "4": "bug", "5": "admin", "6": "prefix" };

export default new class CommandHandler {

  prefixes = new Map<string, PrefixCommandType>();
  aliases = new Map<string, Set<string>>();
  slashCommands = new Map<string, SlashCommandType>();
  contextMenu = new Map<string, ContextMenuBody>();
  applicationCommands = new Map<string, appCommand>();
  blocked = new Map<string, string>();
  APICrossData: Command_Api_Data[] = [];
  allCommands = new Set<string>();

  constructor() { }

  async load() {
    await this.loadPrefixes();
    await this.loadSlashCommands();
    await this.loadContextMenuCommands();
    await this.loadDataCrossAPI();

    if (client.shardId === 0) this.sendDataToAPI();

    this.loadApplicationCommands();
    const blockedCommands = (await Database.getClientData())?.BlockedCommands || [];
    this.setBlockCommands(blockedCommands);
    return;
  }

  async setBlockCommands(data: {
    cmd?: string | null | undefined;
    error?: string | null | undefined;
  }[]) {
    if (data.length) {
      this.blocked.clear();
      for (const { cmd, error } of data)
        if (cmd) this.blocked.set(cmd, error || "No error provider");
    }
  }

  getCommandMention(nameOrId: string) {
    return client.application?.commands.getByName(nameOrId)?.mention
      || client.application?.commands.getById(nameOrId)?.mention;
  }

  isCommandUnderBlock(name: string) {
    return this.blocked.get(name);
  }

  getCommandName(input: string): string | void {
    if (!input) return;
    if (this.prefixes.get(input)) return this.prefixes.get(input)!.name;
    if (this.slashCommands.get(input)) return this.slashCommands.get(input)!.data.name;
    if (this.contextMenu.get(input)) return this.contextMenu.get(input)!.data.name;

    for (const [commandName, aliases] of this.aliases)
      if (aliases.has(input)) {
        const command = this.prefixes.get(commandName);
        if (command) return command.name;
      }

    return;
  }

  getPrefixCommand(name: string): PrefixCommandType | void {
    if (!name) return;

    const command = this.prefixes.get(name);
    if (command) return command;

    for (const [commandName, aliases] of this.aliases)
      if (aliases.has(name)) {
        const command = this.prefixes.get(commandName);
        if (command) return command;
      }

    return;
  }

  getApplicationCommand(name: string) {
    return this.applicationCommands.get(name);
  }

  getSlashCommand(name: string): SlashCommandType | void {
    return this.slashCommands.get(name);
  }

  getContextMenuCommand(cmd: string): ContextMenuBody | void {
    return this.contextMenu.get(cmd);
  }

  async loadPrefixes() {

    const folders = readdirSync("./out/commands/prefix/");
    for await (const folder of folders) {

      const filesNames = readdirSync(`./out/commands/prefix/${folder}/`).filter(file => file.endsWith(".js"));

      for await (const fileName of filesNames) {

        if (typeof fileName !== "string") continue;

        const cmd: PrefixCommandType | undefined = (await import(`../../commands/prefix/${folder}/${fileName}`))?.default;
        if (typeof cmd?.name !== "string" || typeof cmd?.execute !== "function") continue;

        if (cmd.name) {
          client.commandsUsed[cmd.name] = 0;
          this.prefixes.set(cmd.name, cmd);
          this.allCommands.add(cmd.name);
        }

        if (cmd.aliases?.length)
          this.aliases.set(cmd.name, new Set(cmd.aliases));

        continue;
      }
      continue;
    }
  }

  async loadSlashCommands() {

    const folders = readdirSync("./out/commands/slash/");

    for await (const folder of folders) {

      const foldersNames = readdirSync(`./out/commands/slash/${folder}/`).filter(file => file.endsWith(".js"));

      for await (const fileName of foldersNames) {
        if (typeof fileName !== "string") continue;

        const command: SlashCommandType | undefined = (await import(`../../commands/slash/${folder}/${fileName}`))?.default;
        const name = command?.data?.name;
        if (
          !command
          || typeof name !== "string"
          || typeof command?.additional.execute !== "function"
        ) continue;

        command.additional.api_data.tags.push(tags[`${command.data.type}`]);

        if (typeof client.commandsUsed[name] !== "number")
          client.commandsUsed[name] = 0;

        if (["ping", "botinfo"].includes(name))
          functions.set(name, command.additional.execute);

        this.slashCommands.set(name, command);
        this.allCommands.add(name);

        continue;
      }
      continue;
    }
  }

  async loadContextMenuCommands() {

    const folders = readdirSync("./out/commands/contextmenu/");

    for await (const folder of folders) {

      const foldersNames = readdirSync(`./out/commands/contextmenu/${folder}/`).filter(file => file.endsWith(".js"));

      for await (const fileName of foldersNames) {
        if (typeof fileName !== "string") continue;

        const command: ContextMenuBody | undefined = (await import(`../../commands/contextmenu/${folder}/${fileName}`))?.default;
        const name = command?.data?.name;
        if (
          !command
          || typeof name !== "string"
          || typeof command?.additional.execute !== "function"
        ) continue;

        if (typeof client.commandsUsed[name] !== "number")
          client.commandsUsed[name] = 0;

        this.contextMenu.set(name, command);
        this.allCommands.add(name);

        continue;
      }
      continue;
    }
  }

  async sendDataToAPI() {
    setTimeout(async () => await this.sendDataToAPI(), (1000 * 60) * 2);

    if (socket.ws?.connected) {
      if (!this.APICrossData) return;
      socket.ws.send({ type: "apiCommandsData", commandsApi: this.APICrossData });
    }
  }

  async loadApplicationCommands(): Promise<any> {

    if (!client.application)
      return setTimeout(() => this.loadApplicationCommands(), 5000);

    const commands = await client.application.commands.fetch();
    if (!commands?.size) return setTimeout(() => this.loadApplicationCommands(), 5000);

    for (const [_, command] of commands) {
      this.applicationCommands.set(command.name, command);
      this.allCommands.add(command.name);
    }

  }

  commandsAPIDataToArray() {
    return [
      Array.from(this.slashCommands.values()).map(cmd => cmd.data),
      // Array.from(this.userContextMenu.values()).map(cmd => cmd.data),
      Array.from(this.contextMenu.values()).map(cmd => cmd.data),
    ].flat();
  }

  commandsBodyToArray() {
    return [
      Array.from(this.slashCommands.values()),
      // Array.from(this.userContextMenu.values()).map(cmd => cmd.data),
      Array.from(this.contextMenu.values()),
    ].flat();
  }

  async postApplicationCommands(): Promise<string> {

    const response = await client.rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: this.commandsAPIDataToArray() },
    )
      .then(res => {
        if (!Array.isArray(res)) {
          console.log("postApplicationCommands 2", res);
          return `${e.DenyX} | Lista de comandos retornou sem conteúdo atráves do client.rest`;
        }
        return res;
      })
      .catch(err => {
        console.log("postApplicationCommands 1", err);
        return `${e.DenyX} | Erro ao registrar os Slash Commands Globais. Erro escrito no console.`;
      }) as appCommand[] | string;

    console.log(response);
    if (typeof response === "string")
      return response;

    if (response?.length) {
      await this.loadApplicationCommands();
      return `${e.CheckV} | ${response.length} Slash Commands Globais foram registrados.`;
    }

    return `${e.DenyX} | Nenhuma resposta foi obtida`;
  }

  async loadDataCrossAPI(): Promise<Command_Api_Data[]> {

    const blockCommands = await Database.getBlockCommands();
    const data: Command_Api_Data[] = [];

    for await (const cmd of this.commandsBodyToArray()) {

      if (!cmd.additional?.api_data) continue;

      if (cmd.additional?.api_data?.perms?.user?.length)
        cmd.additional.api_data.perms.user = cmd.additional?.api_data.perms.user.map(perm => PermissionsTranslate[<keyof typeof PermissionsTranslate>perm] || perm);

      if (cmd.additional?.api_data?.perms?.bot?.length)
        cmd.additional.api_data.perms.bot = cmd.additional?.api_data.perms.bot.map(perm => PermissionsTranslate[<keyof typeof PermissionsTranslate>perm] || perm);

      if (cmd.additional.admin || cmd.additional.staff)
        cmd.additional.api_data.tags.push(tags["5"]);

      if (cmd.additional?.api_data?.synonyms)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        cmd.additional.api_data.synonyms = cmd.aliases || Object.values(getLocalizations(`${cmd.data.name}.name`)).filter(Boolean);

      const prefix_command = this.prefixes.get(cmd.data.name);
      if (prefix_command) {

        if (prefix_command?.api_data?.tags?.length)
          cmd.additional.api_data.tags.push(...prefix_command.api_data.tags);

        if (!cmd.additional.api_data.tags.includes(tags["6"]))
          cmd.additional.api_data.tags.push(tags["6"]);
        cmd.additional.api_data.aliases = prefix_command.aliases;
      }

      if (blockCommands?.find(Cmd => Cmd.cmd === cmd.data.name))
        cmd.additional.api_data.tags.push(tags["4"]);

      cmd.additional.api_data.tags = Array.from(new Set(cmd.additional.api_data.tags || []));
      data.push(cmd.additional?.api_data);
    }

    for await (const cmd of Array.from(this.prefixes.values())) {
      const command = Object.assign({}, cmd.api_data);

      if (!data.some(c => c.name === cmd.name))
        data.push(
          Object.assign(command, {
            tags: (
              Array.isArray(cmd.api_data?.tags)
                ? cmd.api_data.tags.concat(tags["6"])
                : [tags["6"]]
            ).flat(),
          }),
        );

    }

    return this.APICrossData = data;
  }

  async save(message: Message, commandName: string) {

    if (client.user?.id)
      await Database.Client.updateOne(
        { id: client.user.id },
        { $inc: { ComandosUsados: 1 } },
      );

    Experience.add(message.author.id, 5);
    if (Experience.usersToWarnAboutLevelUp.has(message.author.id))
      Experience.warnLevelUp(message.channel, message.author);

    await Database.Commands.updateOne(
      { id: commandName },
      {
        $inc: { count: 1 },
        $push: {
          usage: {
            guildId: message.guildId || "DM",
            userId: message.author.id,
            channelId: message.channelId || "DM",
            type: "Prefix",
            date: new Date(),
          },
        },
      },
      { upsert: true },
    );

    return;
  }

  async block(cmdName: string, errorMessage?: string) {
    if (env.MACHINE === "localhost") return;
    if (!cmdName) return;
    const error = errorMessage || "Blocked by an Admin";
    this.blocked.set(cmdName, error);

    await Database.Client.updateOne(
      { id: client.user?.id },
      {
        $push: {
          BlockedCommands: {
            $each: [
              {
                cmd: cmdName,
                error,
              },
            ],
            $position: 0,
          },
        },
      },
    );
  }

};