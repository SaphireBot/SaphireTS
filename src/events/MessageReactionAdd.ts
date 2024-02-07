import { Events } from "discord.js";
import client from "../saphire";
import interactionsReaction from "./functions/interactions";

client.on(Events.MessageReactionAdd, async function (reaction, user): Promise<any> {

    if (reaction?.emoji?.name === "🔄") return await interactionsReaction(reaction, user);
    return;
});