import { ChatInputCommandInteraction } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { emojilist } from "../util";
import generator from "./generator";

export default async function lauch(interaction: ChatInputCommandInteraction<"cached">) {

    const { user, options, userLocale: locale } = interaction;
    const member = options.getMember("member")!;

    if (member.id === user.id || member.user.bot)
        return await interaction.reply({
            content: t("memory.member_invalid", { e, locale }),
            ephemeral: true
        });

    const emojiOption = options.getInteger("emojis") ?? -1;
    const emojis = emojiOption === -1 ? emojilist.random() : emojilist[emojiOption];
    const player = [member, user].random();

    const buttons = generator(emojis, member.id);

    return await interaction.reply({
        content: t("memory.cooperative.good_game_and_good_luck", { e, locale, player: player.id }),
        components: buttons
    }).catch(() => { });
}