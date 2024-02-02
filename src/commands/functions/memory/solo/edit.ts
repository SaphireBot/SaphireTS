import { ButtonInteraction, Message } from "discord.js";
import { e } from "../../../../util/json";
import invalid from "./invalid";
import { t } from "../../../../translator";

export default async function edit(interaction: ButtonInteraction<"cached">, message: Message<true>, win: boolean, components: any[]) {

    const data = {
        content: win ? t("memory.solo.finish_success", { e, locale: interaction.userLocale }) : message.content,
        components
    };

    return interaction.replied
        ? await interaction.editReply(data).catch(err => invalid(interaction, components, message, err))
        : await interaction.update(data).catch(err => invalid(interaction, components, message, err));
}