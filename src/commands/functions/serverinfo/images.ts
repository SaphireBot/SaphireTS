import { StringSelectMenuInteraction, ButtonStyle, Colors, APIEmbed, Guild } from "discord.js";
import { e } from "../../../util/json.js";
import { t } from "../../../translator/index.js";

export default async function images(interaction: StringSelectMenuInteraction<"cached">, guild: Guild) {

    const { userLocale: locale } = interaction;
    const indexComponent = interaction.message.components.length > 1 ? 1 : 0;
    const selectMenu = interaction.message.components[indexComponent].toJSON();

    await interaction.update({
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: t("serverinfo.images.loading", locale),
                emoji: e.Loading,
                custom_id: "loading",
                style: ButtonStyle.Secondary,
                disabled: true
            }].asMessageComponents()
        }]
    }).catch(() => { });

    const images = {
        icon: guild.iconURL({ size: 2048 }),
        banner: guild.bannerURL({ size: 2048 }),
        discovery: guild.discoverySplashURL({ size: 2048 }),
        splash: guild.splashURL({ size: 2048 })
    };

    const embeds: APIEmbed[] = [];

    if (images.icon)
        embeds.push({
            color: Colors.Blue,
            description: t("serverinfo.images.icon", { e, locale, images }),
            image: { url: images.icon }
        });

    if (images.banner)
        embeds.push({
            color: Colors.Blue,
            description: t("serverinfo.images.banner", { e, locale, images }),
            image: { url: images.banner }
        });

    if (images.discovery)
        embeds.push({
            color: Colors.Blue,
            description: t("serverinfo.images.discovery", { e, locale, images }),
            image: { url: images.discovery }
        });

    if (images.splash)
        embeds.push({
            color: Colors.Blue,
            description: t("serverinfo.images.splash", { e, locale, images }),
            image: { url: images.splash }
        });

    if (embeds.length) {
        embeds[0].title = t("serverinfo.images.title", locale);
        embeds[embeds.length - 1].footer = {
            text: `🆔 ${guild.id}`,
            icon_url: guild.iconURL() || ""
        };
    }

    let content = null;
    if (!embeds.length)
        content = t("serverinfo.images.do_not_have_images", { e, locale });

    return await interaction.editReply({ content, embeds, components: [selectMenu] }).catch(() => { });
}