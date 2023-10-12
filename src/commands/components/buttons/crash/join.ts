import { ButtonInteraction } from "discord.js";
import Crash from "../../../../structures/crash/crash";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import Database from "../../../../database";

export default async function join(interaction: ButtonInteraction<"cached">, crash: Crash) {

    const { user, userLocale: locale, message } = interaction;

    if (crash.players.has(user.id))
        return await interaction.reply({
            content: t("crash.you_already_in", { e, locale }),
            ephemeral: true
        });

    await interaction.reply({ content: t("crash.put_you_in", { e, locale }), ephemeral: true });
    const balance = (await Database.getUser(user.id))?.Balance || 0;

    if (balance < crash.value)
        return await interaction.editReply({ content: t("crash.balance_not_enough_to_join", { e, locale }) });

    const response = await crash.addPlayer(user.id, message);
    return await interaction.editReply({ content: t(response, { e, locale }) });
}