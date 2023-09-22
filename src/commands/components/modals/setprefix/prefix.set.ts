import { Colors, ModalSubmitInteraction, PermissionFlagsBits } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { getSetPrefixButtons } from "../../buttons/buttons.get";

export default async function setPrefixes(interaction: ModalSubmitInteraction<"cached">) {

    if (!interaction.member?.permissions.has(PermissionFlagsBits.ManageGuild, true))
        return await interaction.reply({
            content: t("setprefix.you_need_permission", {
                locale: interaction.userLocale,
                e,
                permission: t("Discord.Permissions.ManageGuild", interaction.userLocale)
            }),
            embeds: [],
            components: []
        });

    await interaction.deferUpdate();
    const prefixes = new Set<string>();

    for (let i = 1; i < 6; i++) {
        const prefix = interaction.fields.getTextInputValue(`prefix${i}`)?.trim();
        if (!prefix?.includes("|"))
            prefixes.add(prefix);
        continue;
    }

    const availablePrefixes = prefixes.size
        ? Array.from(prefixes).filter(Boolean)
        : ["s!", "-"];

    Database.prefixes.set(interaction.guildId, availablePrefixes);
    return await Database.Guilds.updateOne(
        { id: interaction.guildId },
        { $set: { Prefixes: availablePrefixes } },
        { upsert: true }
    )
        .then(async () => {
            return await interaction.editReply({
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