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
        await jokempo.draw();
        jokempo.delete(true);

        const translateKey = jokempo.value > 0 ? "jokempo.draw_bet" : "jokempo.draw";

        return await interaction.update({
            content: t(translateKey, {
                e,
                locale: creatorLocale,
                emoji: emojis[creatorPlay as keyof typeof emojis],
                name: t(`jokempo.${creatorPlay}`, creatorLocale),
                value: Number((jokempo.value || 0) / 2).currency()
            }) + creatorLocale === opponentLocale
                ? ""
                : t(translateKey, {
                    e,
                    locale: opponentLocale,
                    emoji: emojis[opponentPlay as keyof typeof emojis],
                    name: t(`jokempo.${opponentPlay}`, opponentLocale),
                    value: Number((jokempo.value || 0) / 2).currency()
                }),
            components: []
        });
    }

    if (winner) {
        await jokempo.win(winner);
        const winnerLocale = winner === creator?.id ? creatorLocale : opponentLocale;
        const loserLocale = winner === creator?.id ? opponentLocale : creatorLocale;
        const winnerPlay = winner === creator?.id ? creatorPlay : opponentPlay;
        const loserPlay = winner === creator?.id ? opponentPlay : creatorPlay;

        const translateKeys = {
            win: jokempo.value > 0 ? "jokempo.win_bet" : "jokempo.win",
            lose: jokempo.value > 0 ? "jokempo.lose_bet" : "jokempo.lose"
        };

        jokempo.delete(true);
        return await interaction.update({
            content: t(translateKeys.win, {
                e,
                locale: winnerLocale,
                winner: winner === creator?.id ? creator : opponent,
                emoji: emojis[winnerPlay as keyof typeof emojis],
                name: t(`jokempo.${winnerPlay}`, winnerLocale),
                value: ((jokempo.value || 0) * 2).currency()
            })
                + "\n"
                + t(translateKeys.lose, {
                    e,
                    locale: loserLocale,
                    loser: winner === creator?.id ? opponent : creator,
                    emoji: emojis[loserPlay as keyof typeof emojis],
                    name: t(`jokempo.${loserPlay}`, loserLocale),
                    value: (jokempo.value || 0).currency()
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