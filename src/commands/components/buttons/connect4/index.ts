import { ButtonInteraction, Colors, MessageFlags } from "discord.js";
import { e } from "../../../../util/json";
import play from "./play";
import { t } from "../../../../translator";
import init from "./init";
import deleteConnect4Game from "../../../functions/connect4/delete";

export default async function redirect(
    interaction: ButtonInteraction<"cached">,
    data: { c: "connect", src: "init" | "cancel" | "play" | "info", userId: string, authorId: string },
) {

    const { user, userLocale: locale, message } = interaction;

    if (data?.src === "play") return await play(interaction, data);
    if (data?.src === "init") return await init(interaction, data, interaction.user);

    const execute = { cancel, info }[data?.src as "cancel" | "info"];
    if (!execute)
        return await interaction.update({
            content: "SubFunction_Not_Found_At_Source_Code#68861445#",
            embeds: [], components: [],
        }).catch(() => { });

    return await execute();

    async function cancel() {

        if (![data.userId, data.authorId].includes(user.id))
            return await interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: t("connnect4.you_cannot_click_here", { e, locale }),
            });

        deleteConnect4Game(message.id);
        return await interaction.update({
            content: t("connect4.game_cancelled", { e, locale }),
            components: [],
        }).catch(() => { });
    }

    async function info() {
        return await interaction.reply({
            embeds: [{
                color: Colors.Blue,
                title: "🟡 Connect4 🔴",
                image: {
                    url: "https://media.discordapp.net/attachments/893361065084198954/1090442596251357204/connect4.png?width=421&height=468",
                },
                fields: [
                    {
                        name: t("connect4.embed_info.fields.0.name", locale),
                        value: t("connect4.embed_info.fields.0.value", locale),
                    },
                    {
                        name: t("connect4.embed_info.fields.1.name", locale),
                        value: t("connect4.embed_info.fields.1.value", locale),
                    },
                    {
                        name: t("connect4.embed_info.fields.2.name", { e, locale }),
                        value: t("connect4.embed_info.fields.2.value", locale),
                    },
                ],
            }],
            flags: [MessageFlags.Ephemeral],
        });
    }

}