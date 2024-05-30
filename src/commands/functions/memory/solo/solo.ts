import { ButtonInteraction, ChatInputCommandInteraction, time } from "discord.js";
import { emojilist } from "../util";
import { e } from "../../../../util/json";
import generator from "./generator";
import disable from "./disable";
import { t } from "../../../../translator";

export default async function solo(interaction: ButtonInteraction<"cached"> | ChatInputCommandInteraction<"cached">) {

    const { userLocale: locale } = interaction;
    const mode = interaction.isChatInputCommand() ? interaction.options.getString("mode") : undefined;
    const isLimitedMode = mode === "minutes";
    const emojiOption = interaction.isChatInputCommand() ? interaction.options.getInteger("emojis") || -1 : -1;
    const emojis = emojiOption === -1 ? emojilist.random()! : emojilist[emojiOption];
    const buttons = generator(emojis, isLimitedMode);

    const data = {
        content: `${t("memory.solo.good_game_and_good_luck", { e, locale })}` + `${isLimitedMode ? `\n${t("memory.solo.game_timer", { locale, time: time(new Date(Date.now() + (1000 * 120)), "R") })}` : ""}`,
        components: buttons.default,
        fetchReply: true
    };

    const msg = interaction.isButton() ? await interaction.update(data) : await interaction.reply(data);
    if (isLimitedMode) setTimeout(async () => await disable(msg as any), 1000 * 119);
    return;
}