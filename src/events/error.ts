import { Events } from "discord.js";
import client from "../saphire";

client.on(Events.Error, async function (error) {
    if ([10062, 10008].includes((error as any)?.code)) return;
    console.error(error);
});