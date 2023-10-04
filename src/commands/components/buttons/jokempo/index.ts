import { ButtonInteraction, ButtonStyle } from "discord.js";
import { JokempoManager } from "../../../../managers";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import jokempoPlay from "./play";

export default async function analiseJokempo(
    interaction: ButtonInteraction<"cached">,
    commandData: { c: "jkp", type: "start" | "deny" | "stone" | "paper" | "scissors", value?: number, userId: string }
) {

    const { userLocale: locale, user, member } = interaction;
    const jokempo = JokempoManager.cache.get(interaction.message.id);

    if (!jokempo)
        return await interaction.update({
            content: t("jokempo.not_found", { e, locale }),
            components: []
        });

    if (!jokempo.isPlayer(user.id))
        return await interaction.reply({
            content: t("jokempo.you_are_not_a_player", { e, locale }),
            ephemeral: true
        });

    if (commandData?.type === "deny") {
        jokempo.delete();
        return await interaction.channel?.send({
            content: t("jokempo.cancelled", { e, locale })
        });
    }

    if (commandData?.type === "start") {
        if (user.id !== jokempo.opponentId)
            return await interaction.reply({
                content: t("jokempo.you_cannot_start", { e, locale }),
                ephemeral: true
            });

        const author = await jokempo.getAuthor();

        if (!author) {
            jokempo.delete();
            return await interaction.update({
                content: t("jokempo.author_not_found", { e, locale })
            });
        }

        if ((jokempo.value || 0) > 0) {
            const userData = await Database.getUser(user.id);
            if ((jokempo.value || 0) < (userData?.Balance || 0)) {
                return await interaction.reply({
                    content: t("jokempo.you_need_money", { e, locale }),
                    ephemeral: true
                });
            } else {
                await Database.editBalance(
                    user.id,
                    {
                        createdAt: new Date(),
                        value: jokempo.value,
                        type: "loss",
                        method: "sub",
                        keywordTranslate: "jokempo.transactions.loss"
                    }
                );
            }
        }

        return await interaction.update({
            content: t("jokempo.awaiting_play", { e, locale, member })
                + "\n"
                + t("jokempo.awaiting_play", { e, locale: await author.user?.locale(), member: author }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            emoji: "👊".emoji(),
                            custom_id: JSON.stringify({ c: "jkp", type: "stone" }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            emoji: "🤚".emoji(),
                            custom_id: JSON.stringify({ c: "jkp", type: "paper" }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            emoji: "✌️".emoji(),
                            custom_id: JSON.stringify({ c: "jkp", type: "scissors" }),
                            style: ButtonStyle.Primary
                        }
                    ]
                }
            ]
        });
    }

    if (["stone", "paper", "scissors"].includes(commandData?.type))
        return jokempoPlay(interaction, commandData as any, jokempo);
}