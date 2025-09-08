import { ButtonInteraction, MessageFlags} from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import resetVote from "./reset";
import voteReminder from "./reminder";

export default async function voteButtons(
    interaction: ButtonInteraction<"cached">,
    data?: {
        src: "cancel" | "reset" | "reminder",
        uid: string
    },
) {

    const { userLocale: locale, user, message } = interaction;

    if (user.id !== data?.uid)
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("ping.you_cannot_click_here", { e, locale, username: `<@${data?.uid}>` }),
        });

    if (data.src === "cancel") return await message.delete()?.catch(() => { });
    if (data.src === "reset") return await resetVote(interaction);
    if (data.src === "reminder") return await voteReminder(interaction);

}