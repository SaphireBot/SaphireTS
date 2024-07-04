import { Colors, ModalSubmitInteraction, PermissionFlagsBits } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { getSetPrefixButtons } from "../../buttons/buttons.get";
import client from "../../../../saphire";

export default async function setPrefixes(interaction: ModalSubmitInteraction<"cached">, data: { c: "prefix", src?: "user" | undefined }) {

    const { user, userLocale: locale, guildId, guild } = interaction;

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

    if (data?.src === "user") {
        if (!availablePrefixes.length) {
            Database.prefixes.delete(user.id);
            await Database.Users.updateOne(
                { id: user.id },
                { $unset: { Prefixes: true } },
                { upsert: true }
            );
        } else {
            Database.prefixes.set(user.id, availablePrefixes);
            await Database.Users.updateOne(
                { id: user.id },
                { $set: { Prefixes: availablePrefixes } },
                { upsert: true }
            );
        }
        return await interaction.editReply({
            content: t(
                availablePrefixes.length
                    ? "prefix.success"
                    : "prefix.no_prefixes",
                {
                    e,
                    locale,
                    user,
                    prefixes: Array.from(prefixes).map(prefix => `\`${prefix}\``).join(" & ")
                }
            )
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

    let error: Error | undefined;
    const param = availablePrefixes.length
        ? { $set: { Prefixes: availablePrefixes } }
        : { $unset: { Prefixes: true } };

    await Database.Guilds.updateOne(
        { id: guildId },
        param,
        { upsert: true }
    )
        .then(() => {
            if (availablePrefixes.length)
                Database.prefixes.set(guildId, availablePrefixes);
            else Database.prefixes.set(guildId, client.defaultPrefixes);
        })
        .catch(err => error = err);

    if (error)
        return await interaction.editReply({
            content: t("System_databaseError", {
                e,
                error,
                LineCodeID: "#4385724"
            }),
            embeds: [], components: []
        });

    return await interaction.editReply({
        content: null,
        embeds: [{
            color: Colors.Blue,
            title: `${e.Animated.SaphireReading} ${guild.name} ${t("keyword_prefix", locale)}`,
            description: (Database.prefixes.get(guildId) || client.defaultPrefixes).map((pr, i) => `${i + 1}. **${pr}**`).join("\n"),
            fields: [
                {
                    name: e.Info + " " + t("messageCreate_botmention_embeds[0]_fields[0]_name", locale),
                    value: t("messageCreate_botmention_embeds[0]_fields[0]_value", locale)
                }
            ]
        }],
        components: getSetPrefixButtons(interaction.user.id, locale)
    });


}