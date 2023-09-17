import { Colors } from "discord.js";
import client from "../saphire";
import { Config } from "../util/constants";
import { e } from "../util/json";
import sender from "../services/webhooks/sender";
import { env } from "process";

export default async (reason: any) => {

    /**
     * 500 Internal Server Error
     * 10004 Unknown Guild
     * 10008 Unknown Message
     * 50035 Invalid Form Body (Error Handling Filter)
     * 50013 Missing Permissions
     * 11000 Duplicated Creating Document Mongoose - Ignore Error
     * 50001 DiscordAPIError: Missing Access
     * 10062 Unknow Interaction
     */

    if ([500, 10004, 10008, 10062, 50001, "GuildMembersTimeout"].includes(reason?.code)) return;
    console.log("unhandledRejection", reason);

    await client.users.send(
        Config.ownerId,
        {
            embeds: [{
                color: Colors.Red,
                title: `${e.Loud} Report de Erro | Unhandled Rejection`,
                description: `\`\`\`js\n${reason.stack?.slice(0, 2000)}\`\`\``,
                footer: { text: `Error Code: ${reason.code || 0}` }
            }]
        }
    ).catch(() => { });

    sender(
        env.ROUTE_WEBHOOK_SENDER,
        {
            username: "[Saphire] Unhandled Rejection Reporter",
            avatarURL: Config.ErrorWebhookProfileIcon,
            embeds: [{
                color: Colors.Red,
                title: `${e.Loud} Report de Erro | Unhandled Rejection`,
                description: `\`\`\`js\n${reason.stack?.slice(0, 2000)}\`\`\``,
                footer: { text: `Error Code: ${reason.code || 0}` }
            }]
        }
    );

};