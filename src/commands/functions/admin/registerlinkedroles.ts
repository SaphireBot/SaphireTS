import { ApplicationRoleConnectionMetadataType, ChatInputCommandInteraction, Message } from "discord.js";
import { e } from "../../../util/json";
import client from "../../../saphire";

export default async function (
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>
) {
    {

        const msg = await interactionOrMessage.reply({ content: `${e.Loading} | Registering Linked Roles...` });

        const response = await fetch(
            `https://discord.com/api/v10/applications/${client.user!.id}/role-connections/metadata`,
            {
                method: "PUT",
                body: JSON.stringify([
                    {
                        key: "balance",
                        name: "Sapphires",
                        description: "Minimum quantity of Sapphires",
                        type: ApplicationRoleConnectionMetadataType.IntegerGreaterThanOrEqual
                    },
                    {
                        key: "level",
                        name: "Levels",
                        description: "Minimum Level Amount",
                        type: ApplicationRoleConnectionMetadataType.IntegerGreaterThanOrEqual
                    },
                    {
                        key: "likes",
                        name: "Likes",
                        description: "Minimum number of likes",
                        type: ApplicationRoleConnectionMetadataType.IntegerGreaterThanOrEqual
                    },
                    {
                        key: "date_create",
                        name: "Account Days",
                        description: "Days with account created",
                        type: ApplicationRoleConnectionMetadataType.IntegerGreaterThanOrEqual
                    }
                ]),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bot ${client.token}`,
                }
            }
        );

        let content = `${e.DenyX} | No response was given.`;

        if (response.ok) {
            const data = await response.json() as any;
            content = `${e.CheckV} | ${data?.length || 0} Linked Roles have been setted.`;
        }

        if (!response.ok) {
            content = `${e.DenyX} | error to configuring payloads linked to Discord API. Logs wrote to console.`;
            console.log("linked roles error", await response.text());
        }

        return msg.edit({ content })
            .catch(() => interactionOrMessage.channel?.send({ content }).catch(() => { }));
    }
}