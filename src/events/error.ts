import { Events } from "discord.js";
import client from "../saphire";

client.on(Events.Error, async function (error) {
    if (error.message === "Unknown interaction") return;
    console.error(error);
});