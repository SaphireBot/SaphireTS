import { ButtonInteraction, ButtonStyle, Colors, Routes, parseEmoji } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { mapButtons } from "djs-protofy";
import Database from "../../../database";
import { Config } from "../../../util/constants";
import client from "../../../saphire";
import { time } from "discord.js";
import { TopGGManager } from "../../../managers";

export default async function voteButtons(
    interaction: ButtonInteraction<"cached">,
    data?: {
        src: "cancel" | "reset",
        uid: string
    }
) {

    const { userLocale: locale, user, message, channelId, guildId } = interaction;

    if (user.id !== data?.uid)
        return await interaction.reply({
            content: t("ping.you_cannot_click_here", { e, locale, username: `<@${data?.uid}>` }),
            ephemeral: true
        });

    if (data.src === "cancel") {
        await message.delete()?.catch(() => { });
        return await interaction.reply({
            content: t("vote.canceled", { e, locale }),
            ephemeral: true
        });
    }

    if (data.src === "reset") {
        const components = mapButtons(message.components, button => {
            button.disabled = true;
            if (button.style === ButtonStyle.Link) return button;
            button.emoji = parseEmoji(e.Loading)!;
            return button;
        });

        await interaction.update({ components });
        await sleep(1000);
        const vote = await TopGGManager.fetch(user.id);
        const userData = await Database.getUser(user.id);

        const timeDifferent = (userData.Timeouts?.TopGGVote || 0) > Date.now();
        if (timeDifferent)
            return await interaction.editReply({
                content: t("vote.timeout", {
                    e,
                    locale,
                    time: time(new Date(userData.Timeouts!.TopGGVote), "R")
                }),
                components: []
            }).catch(() => { });

        const document = await TopGGManager.createOrUpdate(
            {
                userId: user.id,
                data: {
                    $set: {
                        userId: user.id,
                        channelId,
                        guildId,
                        messageId: message.id,
                        messageUrl: message.url,
                        deleteAt: Date.now() + (1000 * 60 * 60),
                        enableReminder: vote?.enableReminder || false
                    }
                }
            }
        );

        if (
            (message.id !== vote?.messageId)
            && vote?.channelId
            && vote.messageId
        )
            await client.rest.delete(
                Routes.channelMessage(vote.channelId, vote.messageId)
            ).catch(() => { });

        await sleep(1000);
        await interaction.editReply({
            content: document ? null : t("vote.error_to_create", { e, locale }),
            embeds: document
                ? [{
                    color: Colors.Blue,
                    title: `${e.topgg} Top.GG Bot List`,
                    description: t("vote.waiting_vote", { e, locale })
                }]
                : []
        })
            .catch(async () => await TopGGManager.deleteByUserId(user.id));

        await sleep(1000);
        return await interaction.editReply({
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        label: t("vote.vote", locale),
                        emoji: parseEmoji(e.Upvote),
                        url: Config.TopGGLink,
                        style: ButtonStyle.Link
                    },
                    {
                        type: 2,
                        label: t("vote.cancel", locale),
                        custom_id: JSON.stringify({ c: "vote", src: "cancel", uid: user.id }),
                        emoji: parseEmoji(e.Trash),
                        style: ButtonStyle.Danger
                    }
                ]
            }].asMessageComponents()
        });
    }
}