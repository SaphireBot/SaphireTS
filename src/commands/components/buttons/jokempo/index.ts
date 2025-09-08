import { ButtonInteraction, ButtonStyle, MessageFlags, StringSelectMenuInteraction } from "discord.js";
import { JokempoManager } from "../../../../managers";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import jokempoPlay from "./play";
import send from "./send";
import bet from "./bet";
import select from "./select";
import exec from "./exec";
import disabled from "./disabled";
import play from "./globalPlay";

export default async function analiseJokempo(
    interaction: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached">,
    data: {
        c: "jkp",
        type: "start" | "deny" | "stone" | "paper" | "scissors" | "send" | "bet" | "select" | "exec" | "disabled" | "play",
        value?: number,
        userId: string
    },
) {

    const { userLocale: locale, user, member } = interaction;
    const execute = { send, bet, select, exec, disabled, play }[data?.type as "send" | "bet" | "select"];
    if (execute) return await execute(interaction as any, data as any);

    const jokempo = JokempoManager.cache.get(interaction.message.id);

    if (!jokempo)
        return await interaction.update({
            content: t("jokempo.not_found", { e, locale }),
            embeds: [], components: [],
        });

    if (!jokempo.isPlayer(user.id))
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("jokempo.you_are_not_a_player", { e, locale }),
        });

    if (data?.type === "deny") {
        jokempo.delete();
        return await interaction.channel?.send({
            content: t("jokempo.cancelled", { e, locale }),
        });
    }

    if (data?.type === "start") {
        if (user.id !== jokempo.opponentId)
            return await interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: t("jokempo.you_cannot_start", { e, locale }),
            });

        const author = await jokempo.getAuthor();

        if (!author) {
            jokempo.delete();
            return await interaction.update({
                content: t("jokempo.author_not_found", { e, locale }),
            });
        }

        if ((jokempo.value || 0) > 0) {
            const balance = await Database.getBalance(user.id);
            if ((jokempo.value || 0) > (balance || 0))
                return await interaction.reply({
                    flags: [MessageFlags.Ephemeral],
                    content: t("jokempo.you_need_money", { e, locale }),
                });
            else await Database.editBalance(
                user.id,
                {
                    createdAt: new Date(),
                    value: jokempo.value,
                    type: "loss",
                    mode: "jokempo",
                    method: "sub",
                    keywordTranslate: "jokempo.transactions.loss",
                },
            );
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
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2,
                            emoji: "🤚".emoji(),
                            custom_id: JSON.stringify({ c: "jkp", type: "paper" }),
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2,
                            emoji: "✌️".emoji(),
                            custom_id: JSON.stringify({ c: "jkp", type: "scissors" }),
                            style: ButtonStyle.Primary,
                        },
                    ],
                },
            ],
        });
    }

    if (["stone", "paper", "scissors"].includes(data?.type))
        return await jokempoPlay(interaction as ButtonInteraction<"cached">, data as any, jokempo);
}