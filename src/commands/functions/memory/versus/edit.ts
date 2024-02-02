import { ButtonInteraction, ButtonStyle, GuildMember, User } from "discord.js";
import { e } from "../../../../util/json";
import { MemoryCustomIdData } from "../util";
import { t } from "../../../../translator";

export default async function edit(
    interaction: ButtonInteraction<"cached">,
    { isAccept, replied, componentsUpdate }:
        { isAccept: boolean, replied: boolean, componentsUpdate: boolean },
    allButtons: any[],
    components: any[],
    getFinishResponse: any,
    getMention: any,
    invalid: any,
    commandAuthor: User,
    customIdData: MemoryCustomIdData,
    member: GuildMember
) {

    const win = allButtons.every(b => b.style === ButtonStyle.Success);

    if (componentsUpdate)
        return await interaction.update({ components }).catch(() => { });

    const data = {
        content: win
            ? getFinishResponse()
            : t("memory.versus.good_game_and_good_luck", {
                e,
                locale: interaction.userLocale,
                playerId: getMention(isAccept),
                user: commandAuthor,
                member,
                userPoint: customIdData.up,
                memberPoint: customIdData.mp
            }),
        components
    };

    return replied
        ? await interaction.editReply(data).catch(invalid)
        : await interaction.update(data).catch(invalid);
}