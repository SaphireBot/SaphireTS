
import { ButtonStyle, StringSelectMenuInteraction, Guild, Colors, APIEmbed, Collection, GuildEmoji } from "discord.js";
import { e } from "../../../util/json.js";
import { t } from "../../../translator/index.js";
import { urls } from "../../../util/constants.js";

export default async function emojis(interaction: StringSelectMenuInteraction<"cached">, guild: Guild) {

    const { userLocale: locale } = interaction;
    const indexComponent = interaction.message.components.length > 1 ? 1 : 0;
    const components = interaction.message.components[indexComponent].toJSON();

    await interaction.update({
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: t("serverinfo.emojis.loading", locale),
                emoji: e.Loading,
                custom_id: "loading",
                style: ButtonStyle.Secondary,
                disabled: true
            }].asMessageComponents()
        }]
    }).catch(() => { });

    const emojis = await guild.emojis.fetch().catch(() => []) as Collection<string, GuildEmoji>;

    const data = {
        animated: emojis.filter(emoji => emoji.animated).map(emoji => `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`),
        animatedString: [],
        normal: emojis.filter(emoji => !emoji.animated).map(emoji => `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`),
        normalString: []
    };

    let description1 = "";

    let control = 0;
    if (data.animated.length)
        for (const emoji of data.animated) {
            if (control >= 2680) break;
            data.animatedString.push(emoji as never);
            control += emoji.length;
            continue;
        }

    if (data.animatedString.length)
        description1 = data.animatedString.join(" ");

    const embed = {
        color: Colors.Blue,
        title: t("serverinfo.emojis.embeds.0.title", locale),
        description: description1?.length > 0 ? description1 : null,
        image: { url: description1?.length === 0 ? urls.not_found_image : "" },
        fields: [
            {
                name: t("serverinfo.emojis.embeds.0.fields.0.name", {
                    locale,
                    emoji: data.animatedString.random()! || e.amongusdance
                }).limit("EmbedFieldName"),
                value: t("serverinfo.emojis.embeds.0.fields.0.value", {
                    locale,
                    guild,
                    data,
                    limit: data.animatedString.length < data.animated.length ? `\n${t("serverinfo.emojis.limit", locale)}` : ""
                }).limit("EmbedFieldValue")
            }
        ]
    } as APIEmbed;

    control = 0;
    let description2 = "";

    if (data.normal.length)
        for (const emoji of data.normal) {
            if (control >= 2680) break;
            data.normalString.push(emoji as never);
            control += emoji.length;
            continue;
        }

    if (data.normalString.length)
        description2 = data.normalString.join(" ");

    const embed1 = {
        color: Colors.Blue,
        description: description2?.length > 0 ? description2 : null,
        image: { url: description2?.length === 0 ? urls.not_found_image : "" },
        fields: [{
            name: t("serverinfo.emojis.embeds.0.fields.1.name", {
                locale,
                emoji: data.normalString.random()! || "🙂"
            }),
            value: t("serverinfo.emojis.embeds.0.fields.1.value", {
                locale,
                guild,
                data,
                limit: data.normalString.length < data.normal.length ? `\n${t("serverinfo.emojis.limit", locale)}` : ""
            })
        }],
        footer: {
            text: `🆔 ${guild.id}`,
            icon_url: guild.iconURL() || ""
        }
    } as APIEmbed;

    return await interaction.editReply({ embeds: [embed, embed1], components: [components] }).catch(() => { });
}