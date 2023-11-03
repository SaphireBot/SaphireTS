import { Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";

client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    if (oldGuild.preferredLocale !== newGuild.preferredLocale) socket.twitch.ws.emit("preferredLocale", { guildId: newGuild.id, locale: newGuild.preferredLocale || "en-US" });
});