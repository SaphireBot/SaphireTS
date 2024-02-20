import { Colors, ModalSubmitInteraction, PermissionFlagsBits } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { getSetPrefixButtons } from "../../buttons/buttons.get";

export default async function setPrefixes(interaction: ModalSubmitInteraction<"cached">, data: { c: "prefix", src?: "user" | undefined }) {

    const { user, userLocale: locale } = interaction;

    await interaction.reply({ content: t("prefix.loading", { e, locale }) });

    const prefixes = new Set<string>();
    const inputValues = data?.src === "user" ? 2 : 5;

    for (let i = 1; i <= inputValues; i++) {
        const prefix = interaction.fields.getTextInputValue(`prefix${i}`)?.trim();
        if (prefix?.length && !prefix?.includes("|"))
            prefixes.add(prefix);
        continue;
    }

    const availablePrefixes = Array.from(prefixes).filter(Boolean);
    if (!availablePrefixes.length) availablePrefixes.push(...["s!", "-"]);

    if (data?.src === "user") {
        Database.prefixes.set(user.id, availablePrefixes);
        await Database.Users.updateOne(
            { id: user.id },
            { $set: { Prefixes: availablePrefixes } },
            { upsert: true }
        );
        return await interaction.editReply({
            content: t("prefix.success", {
                e,
                locale,
                user,
                prefixes: Array.from(prefixes).map(prefix => `\`${prefix}\``).join(" & ")
            })
        });
    }

    if (!interaction.member?.permissions.has(PermissionFlagsBits.ManageGuild, true))
        return await interaction.editReply({
            content: t("setprefix.you_need_permission", {
                locale: interaction.userLocale,
                e,
                permission: t("Discord.Permissions.ManageGuild", interaction.userLocale)
            }),
            embeds: [],
            components: []
        });

    Database.prefixes.set(interaction.guildId, availablePrefixes);
    return await Database.Guilds.updateOne(
        { id: interaction.guildId },
        { $set: { Prefixes: availablePrefixes } },
        { upsert: true }
    )
        .then(async () => {
            return await interaction.editReply({
                content: null,
                embeds: [{
                    color: Colors.Blue,
                    title: `${e.Animated.SaphireReading} ${interaction.guild.name} ${t("keyword_prefix", interaction.userLocale)}`,
                    description: availablePrefixes.map((pr, i) => `${i + 1}. **${pr}**`).join("\n"),
                    fields: [
                        {
                            name: e.Info + " " + t("messageCreate_botmention_embeds[0]_fields[0]_name", interaction.userLocale),
                            value: t("messageCreate_botmention_embeds[0]_fields[0]_value", interaction.userLocale)
                        }
                    ]
                }],
                components: getSetPrefixButtons(interaction.user.id, interaction.userLocale)
            });
        })
        .catch(async error => {
            return await interaction.editReply({
                content: t("System_databaseError", {
                    e,
                    error,
                    LineCodeID: "#4385724"
                }),
                embeds: [], components: []
            });
        });


}