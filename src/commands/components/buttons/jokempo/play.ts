import { ButtonInteraction } from "discord.js";
import Jokempo from "../../../../structures/jokempo/jokempo";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import finish from "./finish";

export default async function play(
    interaction: ButtonInteraction<"cached">,
    commandData: { c: "jkp", type: "stone" | "paper" | "scissors", value: number, userId: string },
    jokempo: Jokempo
) {

    const { user, userLocale: locale } = interaction;
    if (!jokempo.isPlayer(user.id))
        return await interaction.reply({
            content: t("jokempo.you_are_not_a_player", { e, locale })
        });

    const emojis = {
        stone: "👊",
        paper: "🤚",
        scissors: "✌️"
    };

    if (jokempo.clicks[user.id])
        return await interaction.reply({
            content: t("jokempo.you_already_played", {
                e,
                locale,
                emoji: jokempo.clicks[user.id] + " " + t(`jokempo.${emojis[jokempo.clicks[user.id] as keyof typeof emojis]}`, locale)
            }),
            ephemeral: true
        });

    jokempo.clicks[user.id] = commandData.type;

    if (
        jokempo.clicks[jokempo.createdBy]
        && jokempo.clicks[jokempo.opponentId]
    )
        return await finish(interaction, jokempo, await jokempo.getAuthor(), await jokempo.getOpponent());

    return await interaction.update({ content: await defineString() });

    async function defineString(): Promise<string> {

        const creator = await jokempo.getAuthor();
        const opponent = await jokempo.getOpponent();

        if (!creator || !opponent) {
            jokempo.delete();
            await interaction.channel?.send({
                content: t("jokempo.someone_not_found", { e, locale })
            });
            return "";
        }

        let content: string = "";
        content += t(
            jokempo.clicks[creator?.id]
                ? "jokempo.played"
                : "jokempo.awaiting_play",
            {
                e,
                locale: await creator.user?.locale(),
                member: creator,
                userId: jokempo.opponentId
            });

        content += "\n";

        content += t(
            jokempo.clicks[opponent?.id]
                ? "jokempo.played"
                : "jokempo.awaiting_play",
            {
                e,
                locale: await opponent.user?.locale(),
                member: opponent,
                userId: jokempo.createdBy
            });

        return content;
    }
}