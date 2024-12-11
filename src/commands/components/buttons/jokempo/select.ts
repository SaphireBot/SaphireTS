import { ButtonInteraction, ButtonStyle, StringSelectMenuInteraction, time } from "discord.js";
import Database from "../../../../database";
import { e } from "../../../../util/json.js";
import { t } from "../../../../translator/src";
import save from "./save";

export default async function select(
    interaction: StringSelectMenuInteraction<"cached">,
    { value, uid }: { c: "jkp", type: "select", value: number, uid: string },
) {

    const { user, message, userLocale: locale } = interaction;

    if (user.id !== uid)
        return await interaction.reply({
            content: t("jokempo.you_are_not_a_player", { locale, e }),
            ephemeral: true,
        });

    const balance = await Database.getBalance(user.id);

    if (balance < value)
        return await interaction.reply({
            content: t("jokempo.sapphires_enough", { locale, e, value: value.currency() }),
            ephemeral: true,
        });

    await interaction.update({
        content: t("jokempo.choose_your_bet", {
            e,
            locale,
            time: time(new Date(Date.now() + 1000 * 30), "R"),
        }),
        embeds: [],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: e.pedra,
                        custom_id: "stone",
                        style: ButtonStyle.Primary,
                    },
                    {
                        type: 2,
                        emoji: e.tesoura,
                        custom_id: "scissors",
                        style: ButtonStyle.Primary,
                    },
                    {
                        type: 2,
                        emoji: e.papel,
                        custom_id: "paper",
                        style: ButtonStyle.Primary,
                    },
                ],
            },
        ].asMessageComponents(),
    }).catch(() => { });

    return message.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        time: 1000 * 30, max: 1,
    })
        .on("collect", (int): any => save(int as ButtonInteraction<"cached">, { option: int.customId as any, value }))
        .on("end", async (_, reason): Promise<any> => {
            if (reason === "time")
                return await interaction.message.edit({
                    content: t("jokempo.time_end", locale),
                    components: [],
                }).catch(() => { });

            return;
        });
}