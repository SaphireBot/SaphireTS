import { Message } from "discord.js";
import { e } from "../../../util/json";
const allowedMethods = ["block", "unblock", "unblockall"];

export default async function commandBlocker(message: Message<true>, args: string[] | undefined, msg: Message) {

    const method: "block" | "unblock" | "unblockall" | string | undefined = args?.[1];
    if (!method || !allowedMethods.includes(method))
        return await msg.edit({
            content: `${e.Animated.SaphireReading} | Métodos permitidos: ${allowedMethods.join(", ")}`
        });

    const commands = args?.slice(2);
    if ((!commands || !commands?.length) && method !== "unblockall")
        return await msg.edit({
            content: `${e.DenyX} | Nenhum comando informado. \`-admin command [block] ban balance...\``
        });

    const response = await fetch("https://api.saphire.one/commands", {
        method: "POST",
        body: JSON.stringify({
            userid: message.author.id,
            command: commands?.length === 1 ? commands[0] : commands,
            reason: "Blocked by an admin",
            method
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(res => res.json())
        .catch(err => ({ message: err })) as { message: string };

    return await msg.edit({
        content: `${e.Info} | ${response?.message as string}`
    });
}