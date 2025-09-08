import { APIActionRowComponent, APIButtonComponent, ButtonInteraction, Colors, MessageFlags } from "discord.js";
import { BaseComponentCustomId } from "../../../../@types/customId";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import Database from "../../../../database";
import Modals from "../../../../structures/modals";
import client from "../../../../saphire";

export default async function prefixConfigure(interaction: ButtonInteraction<"cached">, commandData: BaseComponentCustomId) {

    if (commandData.src === "user")
        return await interaction.showModal(
            Modals.setMyPrefix(
                await Database.getPrefix({ userId: interaction.user.id }),
                interaction.userLocale,
            ),
        );

    if (!commandData?.uid)
        return await interaction.update({ components: [] });

    if (interaction.user.id !== commandData?.uid)
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("setprefix.you_cannot_click_here", { e, locale: interaction.userLocale }),
        });

    if (commandData?.src === "refresh") return reset(interaction);

    return await interaction.showModal(
        Modals.setPrefix(
            await Database.getPrefix({ guildId: interaction.guildId }),
            interaction.userLocale,
        ),
    );
}

async function reset(interaction: ButtonInteraction<"cached">) {

    const components = interaction.message.components[0]?.toJSON() as APIActionRowComponent<APIButtonComponent>;
    const languageKeys = ["keyword_configure", "keyword_reset", "keyword_cancel", "keyword_commands"];

    for (let i = 0; i < languageKeys.length; i++)
        (components.components[i] as any).label = t(languageKeys[i], interaction.userLocale);

    await interaction.update({
        content: t("setprefix.reset_prefix", { e, locale: interaction.userLocale }),
        embeds: [],
        components: [],
    });

    Database.prefixes.set(interaction.guildId, client.defaultPrefixes);

    await Database.Guilds.updateOne(
        { id: interaction.guildId },
        { $unset: { Prefixes: true } },
        { upsert: true },
    )
        .catch(() => { });

    const availablePrefix = await Database.getPrefix({ guildId: interaction.guildId });

    return await interaction.editReply({
        content: null,
        embeds: [{
            color: Colors.Blue,
            title: `${e.Animated.SaphireReading} ${interaction.guild.name} ${t("keyword_prefix", interaction.userLocale)}`,
            description: `${e.Animated.SaphireDance} ${t("messageCreate_botmention_embeds[0]_description", interaction.userLocale)}` + "\n \n" + availablePrefix.map((prefix, i) => `${i + 1}. **${prefix}**`).join("\n") || "OMG!",
            fields: [
                {
                    name: e.Info + " " + t("messageCreate_botmention_embeds[0]_fields[0]_name", interaction.userLocale),
                    value: t("messageCreate_botmention_embeds[0]_fields[0]_value", interaction.userLocale),
                },
            ],
        }],
        components: components ? [components] : [],
    }).catch(() => { });
}