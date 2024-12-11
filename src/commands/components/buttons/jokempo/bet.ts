import { ButtonInteraction, Colors } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { JokempoValues } from "../../../../util/constants";
import client from "../../../../saphire";

export default async function bet(interaction: ButtonInteraction<"cached">, commandData: { uid: string }) {

    const { user, userLocale: locale } = interaction;

    if (user.id !== commandData?.uid)
        return await interaction.reply({
            content: t("jokempo.global.you_cannot_click_here", { e, locale }),
            ephemeral: true,
        });

    await interaction.update({
        content: t("jokempo.global.loading", { locale, e }),
        embeds: [], components: [],
    });

    const selectMenu = {
        type: 1,
        components: [{
            type: 3,
            custom_id: "jkp",
            placeholder: t("jokempo.global.selectmenu.placeholder2", locale),
            options: [] as any[],
        }],
    };

    const jokempos = await Database.Jokempo.find({ global: true }) || [];
    const balance = await Database.getBalance(user.id);

    for (const value of JokempoValues) {
        const jokempoLength = jokempos.filter(data => data.value === value).length || 0;
        selectMenu.components[0].options.push({
            label: `${value.currency()} Safiras`,
            emoji: jokempoLength > 0
                ? balance - value >= 0 ? e.CheckV : e.DenyX
                : balance - value >= 0 ? e.Animated.SaphireCry : e.DenyX,
            description: balance - value >= 0
                ? jokempoLength > 0
                    ? t("jokempo.global.selectmenu.bets_available", { locale, bets: jokempoLength })
                    : t("jokempo.global.selectmenu.bets_unavailabe", { locale, bets: jokempoLength })
                : t("jokempo.global.selectmenu.you_dont_have_money", locale),
            value: JSON.stringify({ c: "jkp", type: "exec", value: value, uid: user.id }),
        });
    }

    const totalValue = jokempos.reduce((acc, cur) => acc += (cur.value || 0), 0) || 0;

    const embed = {
        color: Colors.Blue,
        title: t("jokempo.global.embeds.0.title", { locale, e, client }),
        description: t("jokempo.global.embeds.1.description", { locale, e, balance: balance.currency(), jokempos: jokempos.length?.currency(), totalValue: totalValue.currency() }),
        fields: [
            {
                name: t("jokempo.global.embeds.1.fields.name", { locale, e }),
                value: t("jokempo.global.embeds.1.fields.value", locale),
            },
        ],
    };

    return await interaction.editReply({ content: null, embeds: [embed], components: [selectMenu] }).catch(() => { });
}