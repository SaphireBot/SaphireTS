import { Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { defineGuildStatus } from "./functions/refreshShardStatus";

client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    defineGuildStatus(newGuild);
    if (oldGuild.preferredLocale !== newGuild.preferredLocale) socket.twitch?.emit("preferredLocale", { guildId: newGuild.id, locale: newGuild.preferredLocale || "en-US" });
});