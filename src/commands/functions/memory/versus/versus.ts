import { ChatInputCommandInteraction } from "discord.js";
import { emojilist } from "../util.js";
import { t } from "../../../../translator/index.js";
import { e } from "../../../../util/json.js";
import generator from "./generator.js";

export default async function versus(interaction: ChatInputCommandInteraction<"cached">) {

    const { options, user, userLocale: locale } = interaction;
    const member = options.getUser("member")!;

    if (member.id === user.id || member.bot)
        return await interaction.reply({
            content: t("memory.member_invalid", {}),
            ephemeral: true
        });

    const emojiOption = options.getInteger("emojis") ?? -1;
    const emojis = emojiOption === -1 ? emojilist.random() : emojilist[emojiOption];
    const player = [member, user].random();

    const buttons = generator(emojis, member.id);

    return await interaction.reply({
        content: t("memory.versus.good_game_and_good_luck", {
            e,
            locale,
            playerId: player.id,
            user,
            member,
            userPoint: 0,
            memberPoint: 0
        }),
        components: buttons.default
    }).catch(() => { });
}