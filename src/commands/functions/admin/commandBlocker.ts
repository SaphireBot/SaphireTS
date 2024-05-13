import { Message } from "discord.js";
import { e } from "../../../util/json";
import Database from "../../../database";
import client from "../../../saphire";
import handler from "../../../structures/commands/handler";
import { t } from "../../../translator";
const allowedMethods = ["block", "unblock", "unblockall"];

export default async function commandBlocker(message: Message<true>, args: string[] | undefined, msg: Message) {

    const { userLocale: locale } = message;

    const method = args?.[1] as "block" | "unblock" | "unblockall" | string | undefined;
    if (!method || !allowedMethods.includes(method))
        return await msg.edit({
            content: `${e.Animated.SaphireReading} | Métodos permitidos: ${allowedMethods.join(", ")}`
        });

    const commands = args?.slice(2) || [];
    if ((!commands || !commands?.length) && method !== "unblockall")
        return await msg.edit({
            content: `${e.DenyX} | Nenhum comando informado. \`-admin command [block|unblock] ban balance...\``
        });

    if (method && method === "unblockall") {

        if (!handler.blocked.size)
            return await msg.edit({
                content: t("admin.commands.noBlockCommands", { e, locale })
            });

        await Database.Client.updateOne(
            { id: client.user!.id },
            { $set: { BlockedCommands: [] } }
        );
        handler.blocked.clear();

        return await msg.edit({
            content: t("admin.commands.unblockAll", { e, locale })
        });
    }

    if (["block", "unblock"].includes(method)) {
        const cmds = commands.map(cmd => handler.getCommandName(cmd)!).filter(Boolean);
        if (!cmds.length)
            return await msg.edit({
                content: t("admin.commands.noCommandsGiven", { e, locale })
            });

        if (method === "unblock") {
            for await (const cmd of cmds) {
                await Database.Client.updateOne(
                    { id: client.user!.id },
                    { $pull: { BlockedCommands: { cmd } } }
                );
                handler.blocked.delete(cmd);
            }
            return await msg.edit({
                content: t("admin.commands.commandsUnblocked", {
                    e,
                    locale,
                    commands: cmds.map(cmd => `\`${cmd}\``).join(", ")
                })
            });
        }

        if (method === "block") {
            for await (const cmd of cmds) {
                await Database.Client.updateOne(
                    { id: client.user!.id },
                    {
                        $push: {
                            BlockedCommands: {
                                $each: [{ cmd, error: "Block by an Admin" }],
                                $position: 0
                            }
                        }
                    }
                );
                handler.blocked.set(cmd, "Block by an Admin");
            }

            return await msg.edit({
                content: t("admin.commands.commandsBlocked", {
                    e,
                    locale,
                    commands: cmds.map(cmd => `\`${cmd}\``).join(", ")
                })
            });
        }
    }

}