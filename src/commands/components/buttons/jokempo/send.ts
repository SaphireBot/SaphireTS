import { ButtonInteraction, Colors } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { JokempoValues } from "../../../../util/constants";
import client from "../../../../saphire";

export default async function send(interaction: ButtonInteraction<"cached">, commandData: { uid: string }) {

    const { user, userLocale: locale } = interaction;

    if (user.id !== commandData?.uid)
        return await interaction.reply({
            content: t("jokempo.global.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    const balance = (await Database.getBalance(user.id))?.balance || 0;

    if (balance < 100)
        return await interaction.update({ content: t("jokempo.global.minus_100", { e, locale }) });

    const selectMenu = {
        type: 1,
        components: [{
            type: 3,
            custom_id: "jkp",
            placeholder: t("jokempo.global.selectmenu.placeholder", locale),
            options: [] as any[]
        }]
    };
    const jokempos = await Database.Jokempo.find({ createdBy: user.id }) || [];
    const emojis = [e.pedra, e.tesoura, e.papel];

    for (const value of JokempoValues)
        selectMenu.components[0].options.push({
            label: t("jokempo.global.selectmenu.label", {
                locale,
                value: value.currency()
            }),
            emoji: balance - value >= 0 ? emojis.random()! : e.DenyX,
            description: balance - value >= 0
                ? t("jokempo.global.selectmenu.you_have_money", locale)
                : t("jokempo.global.selectmenu.you_dont_have_money", locale),
            value: JSON.stringify({ c: "jkp", type: "select", value, uid: user.id })
        });

    const totalValue = jokempos.reduce((acc, cur) => acc += (cur.value || 0), 0) || 0;

    const embed = {
        color: Colors.Blue,
        title: t("jokempo.global.embeds.0.title", { locale, e, client: client }),
        description: t("jokempo.global.embeds.1.description", { locale, e, balance: balance.currency(), jokempos: jokempos.length?.currency(), totalValue: totalValue.currency() }),
        fields: [
            {
                name: t("jokempo.global.embeds.1.fields.name", { locale, e }),
                value: t("jokempo.global.embeds.1.fields.value", locale),
            }
        ]
    };

    return await interaction.update({ embeds: [embed], components: [selectMenu] }).catch(() => { });
}