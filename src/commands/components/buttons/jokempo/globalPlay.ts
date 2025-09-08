import { ButtonInteraction, MessageFlags } from "discord.js";
import draw from "./draw";
import win from "./win";
import lose from "./lose";
import Database from "../../../../database/index.js";
import { e } from "../../../../util/json.js";
import check from "./check.js";
import { JokempoEmojis } from "../../../../@types/commands";
import { t } from "../../../../translator";

export default async function globalPlay(
    interaction: ButtonInteraction<"cached">,
    { play, id }: { c: "jkp", type: "play", play: "stone" | "paper" | "scissors", id: string },
) {

    const jokempo = await Database.Jokempo.findOne({ id });
    const { user, userLocale: locale } = interaction;

    if (!jokempo)
        return await interaction.update({
            content: t("jokempo.unknown_game", { e, locale }),
            components: [], embeds: [],
        }).catch(() => { });

    if (user.id !== jokempo.opponentId)
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("jokempo.you_are_not_a_player", { e, locale }),
        });

    const emojis = { stone: "👊", paper: "🤚", scissors: "✌️" };
    jokempo.clicks[user.id] = play;

    const winner = check({
        [user.id]: emojis[play],
        [jokempo.createdBy!]: (emojis[(jokempo.clicks[jokempo.createdBy!]) as "stone" | "paper" | "scissors"] as JokempoEmojis),
    } as any);

    await Database.Jokempo.deleteOne({ id });
    if (winner === "draw") return await draw(interaction, jokempo);
    if (winner[0] === user.id) return await win(interaction, jokempo);
    return await lose(interaction, jokempo);
}