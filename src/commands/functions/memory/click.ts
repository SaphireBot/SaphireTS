import { ButtonInteraction } from "discord.js";
import { MemoryCustomIdData } from "./util";
import cooperative from "./cooperative/click";
import solo from "./solo/click";
import versus from "./versus/click";

/**
 * interaction: BUTTON INTERACTION
 */
export default async function click(
    interaction: ButtonInteraction<"cached">,
    customIdData: MemoryCustomIdData
) {

    const {
        id, // All modes
        mId, // Cooperative mode, except solo and versus,
        mp // Versus mode, except solo and cooperative
    } = customIdData;

    if (typeof mp === "number") return await versus(interaction, customIdData as any);
    if (mId) return await cooperative(interaction, customIdData);
    if (id) return await solo(interaction, customIdData);
    return;
}