import { StringSelectMenuInteraction, ButtonStyle, Colors, codeBlock, Guild } from "discord.js";
import { e } from "../../../util/json.js";
import client from "../../../saphire/index.js";
import { t } from "../../../translator/index.js";

export default async function features(interaction: StringSelectMenuInteraction<"cached">, guild: Guild) {

    const { userLocale: locale } = interaction;
    const indexComponent = interaction.message.components.length > 1 ? 1 : 0;
    const selectMenu = interaction.message.components[indexComponent].toJSON();

    await interaction.update({
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: t("serverinfo.features.loading", locale),
                emoji: e.Loading,
                custom_id: "loading",
                style: ButtonStyle.Secondary,
                disabled: true
            }].asMessageComponents()
        }]
    }).catch(() => { });

    const guildFeatures = guild.features;
    const features = guildFeatures.map(feature => t(feature, locale)).join("\n") || t("serverinfo.features.without", locale);

    const embed = {
        color: Colors.Blue,
        title: t("serverinfo.features.title", locale),
        description: codeBlock("TXT", features),
        fields: [
            {
                name: t("serverinfo.features.field.name", { e, locale }),
                value: t("serverinfo.features.field.value", { e, locale, client })
            }
        ],
        footer: {
            text: `🆔 ${guild.id}`,
            icon_url: guild.iconURL() || ""
        }
    };

    return await interaction.editReply({ embeds: [embed], components: [selectMenu] }).catch(() => { });
}