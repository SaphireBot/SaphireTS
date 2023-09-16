import { Events } from "discord.js";
import client from "../saphire";

client.on(Events.Error, async function (error) {
    console.error(error);
});