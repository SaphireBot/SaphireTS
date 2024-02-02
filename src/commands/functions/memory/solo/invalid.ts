import { ButtonInteraction, Message } from "discord.js";
import disable_game from "./disable_game";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function invalid(interaction: ButtonInteraction<"cached">, components: any[], message: Message<true>, args: any) {

    if (args) return await disable_game(interaction, components);
    const locale = interaction.userLocale;

    await interaction.deferUpdate().catch(() => { });

    return await message.edit({
        content: args ? t("memory.end", { e, locale }) : t("memory.invalid", { e, locale }),
        components: args ? components : []
    }).catch(() => message.delete().catch(() => { }));
}