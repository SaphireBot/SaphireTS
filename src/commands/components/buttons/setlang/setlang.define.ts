import { ButtonInteraction } from "discord.js";
import { SetLangButtonCustomId } from "../../../../@types/customId";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import Database from "../../../../database";
import { languages } from "../../../../@prototypes/User";

export default async function defineLanguage(interaction: ButtonInteraction, customData: SetLangButtonCustomId) {

    if (!customData?.lang || !["en-US", "es-ES", "fr", "ja", "pt-BR"].includes(customData?.lang))
        return await interaction.update({
            content: `${e.DenyX} | ${t("setlang.language_not_found", interaction.userLocale)}`
        }).catch(() => { });

    if (interaction.userLocale === customData.lang)
        return interaction.user.id === customData?.uid
            ? await interaction.update({ content: `${e.Loading} | ${t("setlang.iquals_languages", interaction.userLocale)}` }).catch(() => { })
            : await interaction.reply({ content: `${e.Loading} | ${t("setlang.iquals_languages", interaction.userLocale)}`, ephemeral: true });

    interaction.user.id === customData?.uid
        ? await interaction.update({
            content: `${e.Animated.SaphireReading} | ${t("setlang.loading_new_language", customData?.lang)}`,
            components: []
        }).catch(() => { })
        : await interaction.reply({
            content: `${e.Animated.SaphireReading} | ${t("setlang.loading_new_language", customData?.lang)}`,
            ephemeral: true
        });

    return await Database.Users.updateOne(
        { id: interaction.user.id },
        { $set: { locale: customData.lang } }
    )
        .then(async value => {
            const content = value.modifiedCount === 1
                ? (() => {
                    languages.set(interaction.user.id, customData.lang);
                    return `${e.CheckV} | ${t("setlang.success_change", customData?.lang)}`;
                })()
                : `${e.DenyX} | ${t("setlang.iquals_languages", interaction.userLocale)}`;

            return await interaction.editReply({ content, components: [] }).catch(() => { });
        })
        .catch(async (err: Error) => {
            return await interaction.editReply({
                content: `${e.DenyX} | ${t("setlang.fail_change", interaction.userLocale)}\n${e.bug} | \`${err}\``,
                components: []
            }).catch(() => { });
        });


}