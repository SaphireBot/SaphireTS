import { ButtonStyle, ChannelType, ChatInputCommandInteraction, Colors, AutocompleteInteraction, ButtonInteraction } from "discord.js";
import { Config as config, ErrorsToIgnore, ErrorResponse, DiscordErrorsMessage } from "../../util/constants";
import { e } from "../../util/json.js";
import Database from "../../database";
import client from "../../saphire";
import sender from "../../services/webhooks/sender";
import { t } from "../../translator";
import { env } from "process";
import handler from "../../structures/commands/handler";

export default
    async (interaction: ChatInputCommandInteraction, err: any) => {

        if ([10062, 10008].includes(err?.code)) return;

        console.log("ChatInputCommandInteraction error", err);
        const errorCode: number | string = err?.code;

        if (
            typeof errorCode === "string"
            && DiscordErrorsMessage[<keyof typeof DiscordErrorsMessage>errorCode]
        )
            return await replyError(interaction, DiscordErrorsMessage[<keyof typeof DiscordErrorsMessage>errorCode]);

        if (
            errorCode === 10062
            || err?.message === "Unknown Interaction"
        )
            return await replyError(interaction, t("Discord.Errors.InteractionAlreadyReplied", interaction.userLocale));

        if (
            !err
            || !interaction
            || !interaction?.commandName
            // Unknown Interaction | Unknown Message
            || [10062, 10008].includes(err.code)
            || err.message === "Unknown Interaction"
        ) return;

        const isTextChannel = interaction.channel?.type === ChannelType.GuildText;

        if (
            ErrorsToIgnore.includes(<number>errorCode)
            || [
                "InteractionAlreadyReplied"
            ].includes(<string>errorCode)
        )
            return await replyError(interaction, ErrorResponse[<keyof typeof ErrorResponse>errorCode]);

        if (interaction.commandName && env.MACHINE !== "localhost")
            await handler.block(interaction.commandName, err?.message || t("keyword_undefined", interaction.userLocale));

        const ChannelInvite = isTextChannel
            && await interaction.channel?.createInvite({ maxAge: 0 }).catch(() => null);

        client.users.send(
            config.ownerId,
            {
                embeds: [{
                    color: Colors.Red,
                    title: `${e.Loud} Error Handler | Interaction Command`,
                    description: `\`\`\`js\n${err.stack?.slice(0, 4000)}\`\`\``,
                    fields: [
                        {
                            name: "👤 Author",
                            value: `${interaction.user?.toString()} | ${interaction.user?.username} | *\`${interaction.user.id}\`*`
                        },
                        {
                            name: "✍ Locale",
                            value: isTextChannel ? `Channel: ${interaction.channel?.toString()} - ${interaction.channel?.name}` : "Dm"
                        },
                        {
                            name: "⚙ Command",
                            value: interaction.mention,
                            inline: true
                        }
                    ],
                    footer: {
                        text: `Error Code: ${err.code || "No error code"}`
                    }
                }],
                components: ChannelInvite
                    ? [{
                        type: 1,
                        components: [{
                            type: 2,
                            label: interaction.guild?.name || "Name not found",
                            style: ButtonStyle.Link,
                            url: `https://discord.gg/${ChannelInvite.code}`
                        }]
                    }]
                    : []
            }
        ).catch(() => { });

        sender(
            process.env.WEBHOOK_DATABASE_LOGS,
            {
                username: "[Saphire] Error Reporter",
                embeds: [{
                    color: Colors.Red,
                    title: `${e.Loud} Error Handler | Interaction Command`,
                    description: `\`\`\`js\n${err.stack?.slice(0, 4000)}\`\`\``,
                    fields: [
                        {
                            name: "👤 Author",
                            value: `${interaction.user?.toString()} | ${interaction.user?.username} | *\`${interaction.user.id}\`*`
                        },
                        {
                            name: "✍ Locale",
                            value: isTextChannel ? `Channel: ${interaction.channel?.toString()} - ${interaction.channel?.name}` : "DM"
                        },
                        {
                            name: "⚙ Command",
                            value: interaction.mention,
                            inline: true

                        }
                    ],
                    footer: {
                        text: `Error Code: ${err.code || "No error code"}`
                    }
                }]
            }
        );

        Database.editBalance(
            interaction.user.id,
            {
                createdAt: new Date(),
                method: "add",
                type: "system",
                value: 10000,
                mode: "system",
                keywordTranslate: "Saphire.transactions.bug"
            });

        const content = `${e.Warn} ${t("System_an_error_occurred", {
            locale: interaction.userLocale,
            gainEmoji: e.gain,
            coinEmoji: `${e.Coin} Safiras`
        })}`;
        return await replyError(interaction, content);
    };

async function replyError(interaction: ChatInputCommandInteraction | AutocompleteInteraction | ButtonInteraction, messageResponse: string | undefined) {
    if (!messageResponse || typeof messageResponse !== "string") return;
    const data = { content: messageResponse.limit("MessageContent"), embeds: [], components: [], ephemeral: true };

    if (interaction.isAutocomplete())
        return await interaction.respond([{ name: data.content.slice(0, 100), value: "ignore" }]);

    if (interaction.deferred || interaction.replied) {
        if (interaction.isMessageComponent() || interaction.isModalSubmit())
            return await interaction.followUp(data);

        return await interaction.editReply(data);
    }

    return await (interaction as any).reply(data).catch(() => { });

}
