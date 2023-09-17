import { readdirSync } from "fs";
import { APIApplicationCommand, RESTPutAPIApplicationCommandsResult, Routes, Snowflake } from "discord.js";
import socket from "../services/api/ws/index";
import { e } from "../util/json";
import client from "../saphire/index";
import { Config, PermissionsTranslate } from "../util/constants";
import { Command_Api_Data, PrefixCommandType, SlashCommandType } from "../@types/commands";
const globalSlashCommands: (APIApplicationCommand & { id?: Snowflake })[] = [];
export const commands: SlashCommandType[] = [];
export const adminCommands: SlashCommandType[] = []; // Ideia dada por Gorniaky - 395669252121821227
export const commandsApi: Command_Api_Data[] = [];
export const prefixCommands = new Map<string, PrefixCommandType>();
export const prefixAliasesCommands = new Map<string, PrefixCommandType>();
export const slashCommands = new Map<string, SlashCommandType>();
const tags = { "1": "slash", "2": "apps", "3": "apps", "4": "bug", "5": "admin", "6": "prefix" };

export default async () => {

    const clientData = await client.getData();
    const blockCommands = clientData?.ComandosBloqueadosSlash || [];

    // Prefix Commands
    const prefixCommandsFolders = readdirSync("./out/commands/prefix/");
    for await (const folder of prefixCommandsFolders) {

        const prefixCommandsFiles = readdirSync(`./out/commands/prefix/${folder}/`).filter(file => file.endsWith(".js"));

        for await (const fileName of prefixCommandsFiles) {

            if (typeof fileName !== "string") continue;

            const cmd = (await import(`./prefix/${folder}/${fileName}`))?.default;
            if (typeof cmd?.name !== "string" || typeof cmd?.execute !== "function") continue;

            if (cmd.name) {
                client.commandsUsed[cmd.name] = 0;
                prefixCommands.set(cmd.name, cmd);
            }

            if (cmd.aliases?.length)
                for (const alias of cmd.aliases)
                    prefixAliasesCommands.set(alias, cmd);

            continue;
        }
        continue;
    }

    // Slash Commands
    const slashCommandsFolders = readdirSync("./out/commands/slash/");
    const applicationCommand: { name: string, id: string }[] = await socket?.timeout(2000).emitWithAck("getApplicationCommands", "get").catch(() => []);

    for await (const folder of slashCommandsFolders) {

        const slashCommandsFiles = readdirSync(`./out/commands/slash/${folder}/`).filter(file => file.endsWith(".js"));

        for await (const fileName of slashCommandsFiles) {
            if (typeof fileName !== "string") continue;

            const cmd: SlashCommandType = (await import(`./slash/${folder}/${fileName}`))?.default;

            if (!cmd?.data || !cmd?.additional) continue;
            const applicationCommandData = applicationCommand?.find(c => c?.name === cmd.data.name);

            if (cmd.data.name) {
                cmd.additional.api_data.tags.push(tags[`${cmd.data.type}`]);
                client.commandsUsed[cmd.data.name] = 0;

                if (cmd.additional.admin || cmd.additional.staff)
                    adminCommands.push(cmd);
                else {
                    commands.push(cmd);
                    globalSlashCommands.push(cmd.data);
                }

                if (applicationCommandData?.id) cmd.data.id = applicationCommandData?.id;
                slashCommands.set(cmd.data.name, cmd);
            }
            continue;
        }
        continue;
    }

    for await (const cmd of [commands, adminCommands].flat()) {
        if (!cmd.additional?.api_data) continue;

        if (cmd.additional?.api_data?.perms?.user?.length)
            cmd.additional.api_data.perms.user = cmd.additional?.api_data.perms.user.map(perm => PermissionsTranslate[<keyof typeof PermissionsTranslate>perm] || perm);

        if (cmd.additional?.api_data?.perms?.bot?.length)
            cmd.additional.api_data.perms.bot = cmd.additional?.api_data.perms.bot.map(perm => PermissionsTranslate[<keyof typeof PermissionsTranslate>perm] || perm);

        if (cmd.additional.admin || cmd.additional.staff)
            cmd.additional.api_data.tags.push(tags["5"]);

        const prefix_command = prefixCommands.get(cmd.data.name);
        if (prefix_command) {

            if (prefix_command?.api_data?.tags?.length)
                cmd.additional.api_data.tags.concat(prefix_command?.api_data?.tags);

            if (!cmd.additional.api_data.tags.includes(tags["6"]))
                cmd.additional.api_data.tags.push(tags["6"]);
            cmd.additional.api_data.aliases = prefix_command.aliases;
        }

        if (blockCommands?.find(Cmd => Cmd.cmd === cmd.data.name))
            cmd.additional.api_data.tags.push(tags["4"]);

        commandsApi.push(cmd.additional?.api_data);
    }

    for await (const cmd of Array.from(prefixCommands.values())) {
        const command = Object.assign({}, cmd.api_data);

        if (!commandsApi.some(c => c.name === cmd.name))
            commandsApi.push(
                Object.assign(command, {
                    tags: Array.isArray(cmd.api_data?.tags) ? cmd.api_data?.tags.concat(tags["6"]) : [tags["6"]]
                })
            );
    }

    if (client.shardId === 0) {
        const interval = setInterval(() => {
            if (socket?.connected) {
                socket?.send({ type: "apiCommandsData", commandsApi });
                clearInterval(interval);
            }
        }, 1000 * 5);
    }

    return;
};

export async function registerCommands(): Promise<string> {

    if (!client.user?.id) return "Client's ID missing";

    for await (const guildId of Config.guildsToPrivateCommands || [])
        await client.rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: adminCommands.map(cmd => cmd.data) })
            .catch(() => { });

    const response = await client.rest.put(
        Routes.applicationCommands(client.user.id), {
        body: globalSlashCommands.map(cmd => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            delete cmd.id;
            return cmd;
        })
    })
        .then(value => {
            if (Array.isArray(value))
                return value as RESTPutAPIApplicationCommandsResult;

            return `${e.DenyX} | Lista de comandos não recebida.`;
        })
        .catch(err => {
            console.log(err);
            return `${e.DenyX} | Erro ao registrar os Slash Commands Globais. Erro escrito no console.`;
        });

    if (typeof response === "string")
        return response;

    if (response?.length) {

        for (const cmd of response) {
            const cmdData = slashCommands.get(cmd.name);
            if (cmdData) {
                cmdData.data.id = cmd.id;
                slashCommands.set(cmd.name, cmdData);
            }
        }

        return `${e.CheckV} | ${response.length} Slash Commands Globais foram registrados.`;
    }

    return `${e.DenyX} | Nenhuma resposta foi obtida`;
}