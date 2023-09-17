import { PrefixCommandType } from "../@types/client";
import { readdirSync } from "fs";
import { join } from "path";

export const prefixCommands = new Map<string, PrefixCommandType>();

export async function loadCommands() {

    const prefixCommandsFolders = readdirSync("./out/commands/prefix/");

    for await (const folder of prefixCommandsFolders) {
        const filesNames = readdirSync(`./out/commands/prefix/${folder}`).filter(file => file.endsWith(".js"));
        for await (const fileName of filesNames) {
            const file: PrefixCommandType | undefined = (await import(join(__dirname, "prefix", folder, fileName)))?.default;
            if (!file?.name) {
                console.log("File or file name was not found", fileName);
                continue;
            }
            prefixCommands.set(file.name, file);
            continue;
        }

    }

    console.log(prefixCommands.size, "commands loaded");
}

// export async function loadSlashCommands() {

//      const slashCommandsFolders = readdirSync("./out/commands/slash/");
//      if (!slashCommandsFolders?.size) return;
    
//      for await (const folder of slashCommandsFolders) {}
// }
