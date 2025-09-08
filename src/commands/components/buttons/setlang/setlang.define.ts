import { ButtonInteraction, MessageFlags } from "discord.js";
import { SetLangButtonCustomId } from "../../../../@types/customId";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import Database from "../../../../database";
import { locales } from "../../../../@prototypes/User";
import { Config } from "../../../../util/constants";

export default async function defineLanguage(interaction: ButtonInteraction, customData: SetLangButtonCustomId) {

    if (!customData?.lang || !Config.locales.includes(customData?.lang))
        return await interaction.update({
            content: t("setlang.language_not_found", {
                locale: interaction.userLocale,
                e,
            }),
        }).catch(() => { });

    if (interaction.userLocale === customData.lang) {
        const content = t("setlang.iquals_languages", {
            locale: interaction.userLocale,
            emoji: e.Loading,
        });
        return interaction.user.id === customData?.uid
            ? await interaction.update({ content }).catch(() => { })
            : await interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content,
            });
    }

    if (interaction.user.id === customData?.uid)
        await interaction.update({
            content: t("setlang.loading_new_language", { locale: customData?.lang, e }),
            components: [],
        }).catch(() => { });
    else await interaction.reply({
        flags: [MessageFlags.Ephemeral],
        content: t("setlang.loading_new_language", { locale: customData?.lang, e }),
    });

    return await Database.Users.updateOne(
        { id: interaction.user.id },
        { $set: { locale: customData.lang } },
    )
        .then(async value => {
            const content = value.modifiedCount === 1
                ? (() => {
                    locales.set(interaction.user.id, customData.lang);
                    return t("setlang.success_change", { locale: customData?.lang, e });
                })()
                : t("setlang.iquals_languages", { locale: interaction.userLocale, emoji: e.DenyX });

            return await interaction.editReply({ content, components: [] }).catch(() => { });
        })
        .catch(async (err: Error) => {
            return await interaction.editReply({
                content: t("setlang.fail_change", { locale: interaction.userLocale, e }) + `\n${e.bug} | \`${err}\``,
                components: [],
            }).catch(() => { });
        });


}