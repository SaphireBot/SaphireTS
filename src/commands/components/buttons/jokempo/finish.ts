import { ButtonInteraction, GuildMember } from "discord.js";
import Jokempo from "../../../../structures/jokempo/jokempo";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";

export default async function finishGame(
    interaction: ButtonInteraction<"cached">,
    jokempo: Jokempo,
    creator: GuildMember | undefined,
    opponent: GuildMember | undefined
) {

    let winner: string = "";
    const creatorPlay = jokempo.clicks[jokempo.createdBy];
    const opponentPlay = jokempo.clicks[jokempo.opponentId];

    if (creatorPlay === "stone" && opponentPlay === "paper") winner = jokempo.opponentId;
    if (creatorPlay === "stone" && opponentPlay === "scissors") winner = jokempo.createdBy;
    if (creatorPlay === "paper" && opponentPlay === "scissors") winner = jokempo.opponentId;
    if (creatorPlay === "paper" && opponentPlay === "stone") winner = jokempo.createdBy;
    if (creatorPlay === "scissors" && opponentPlay === "stone") winner = jokempo.opponentId;
    if (creatorPlay === "scissors" && opponentPlay === "paper") winner = jokempo.createdBy;
    if (creatorPlay === opponentPlay) winner = "draw";

    const creatorLocale = await creator?.user?.locale();
    const opponentLocale = await opponent?.user?.locale();

    const emojis = {
        stone: "👊",
        paper: "🤚",
        scissors: "✌️"
    };

    if (winner === "draw") {
        jokempo.delete(true);

        return await interaction.update({
            content: creatorLocale === opponentLocale
                ? t("jokempo.draw", {
                    e,
                    locale: opponentLocale,
                    emoji: emojis[creatorPlay as keyof typeof emojis],
                    name: t(`jokempo.${creatorPlay}`, opponentLocale)
                })
                : t("jokempo.draw", {
                    e,
                    locale: creatorLocale,
                    emoji: emojis[creatorPlay as keyof typeof emojis],
                    name: t(`jokempo.${creatorPlay}`, creatorLocale)
                })
                + "\n"
                + t("jokempo.draw", {
                    e,
                    locale: opponentLocale,
                    emoji: emojis[opponentPlay as keyof typeof emojis],
                    name: t(`jokempo.${opponentPlay}`, opponentLocale)
                }),
            components: []
        });
    }

    if (winner) {
        jokempo.delete(true);
        const winnerLocale = winner === creator?.id ? creatorLocale : opponentLocale;
        const loserLocale = winner === creator?.id ? opponentLocale : creatorLocale;
        const winnerPlay = winner === creator?.id ? creatorPlay : opponentPlay;
        const loserPlay = winner === creator?.id ? opponentPlay : creatorPlay;

        return await interaction.update({
            content: t("jokempo.win", {
                e,
                locale: winnerLocale,
                winner: winner === creator?.id ? creator : opponent,
                emoji: emojis[winnerPlay as keyof typeof emojis],
                name: t(`jokempo.${winnerPlay}`, winnerLocale)
            })
                + "\n"
                + t("jokempo.lose", {
                    e,
                    locale: loserLocale,
                    loser: winner === creator?.id ? opponent : creator,
                    emoji: emojis[loserPlay as keyof typeof emojis],
                    name: t(`jokempo.${loserPlay}`, loserLocale)
                }),
            components: []
        });
    }

    jokempo.delete();
    return await interaction.update({
        content: creatorLocale === opponentLocale
            ? t("jokempo.unknown_result", { e, locale: opponentLocale })
            : t("jokempo.unknown_result", { e, locale: creatorLocale })
            + "\n"
            + t("jokempo.unknown_result", { e, locale: opponentLocale, }),
        components: []
    });

}