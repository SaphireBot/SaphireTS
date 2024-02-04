import socket from "../services/api/ws";

export async function refreshGuildsCaches(): Promise<{ name: string, id: string }[]> {
    if (!socket.ws?.connected) return [];
    const guilds = await socket.ws.timeout(2000)?.emitWithAck("getAllGuilds", "get").catch(() => []) as { name: string, id: string }[];
    if (!guilds?.length) return [];
    return guilds;
}