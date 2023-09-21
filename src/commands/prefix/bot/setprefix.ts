import { ButtonStyle, Colors, PermissionFlagsBits, Message } from "discord.js";
import { e } from "../../../util/json";
import Database from "../../../database";
import { t } from "../../../translator";
import { urls } from "../../../util/constants";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
    name: "setprefix",
    description: "Define up to 5 prefixes of your choice.",
    aliases: ["setprefix", "prefix", "prefijo", "préfixe", "プレフィクス", "präfix"],
    category: "bot",
    api_data: {
        category: "Saphire",
        synonyms: ["setprefix", "prefix", "prefijo", "préfixe", "プレフィクス", "präfix"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    async execute(message: Message) {

        if (!message.guild || !message.guildId)
            return await message.reply({
                content: t("System_no_data_recieved", {
                    locale: message.userLocale,
                    e
                })
            });

        if (!message.member?.permissions.any(PermissionFlagsBits.ManageGuild, true))
            return await message.reply({ content: t("System_permissions_missing", { e, lcoale: message.userLocale }) });

        const availablePrefix = await Database.getPrefix(message.guildId);
        const locale = message.userLocale;

        return await message.reply({
            embeds: [{
                color: Colors.Blue,
                title: `${e.Animated.SaphireReading} ${message.guild.name} ${t("keyword_prefix", locale)}`,
                description: `${e.saphirePolicial} | ${t("messageCreate_botmention_embeds[0]_description", locale)}` + "\n \n" + availablePrefix.map((prefix, i) => `${i + 1}. **${prefix}**`).join("\n") || "OMG!",
                fields: [
                    {
                        name: e.Info + " " + t("messageCreate_botmention_embeds[0]_fields[0]_name", locale),
                        value: t("messageCreate_botmention_embeds[0]_fields[0]_value", locale)
                    }
                ]
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("keyword_configure", locale),
                            emoji: e.Commands.emoji(),
                            custom_id: JSON.stringify({ c: "prefix", uid: message.author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("keyword_reset", locale),
                            emoji: "🧹".emoji(),
                            custom_id: JSON.stringify({ c: "prefix", uid: message.author.id, src: "refresh" }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("keyword_cancel", locale),
                            emoji: e.Trash.emoji(),
                            custom_id: JSON.stringify({ c: "delete", uid: message.author.id }),
                            style: ButtonStyle.Danger
                        },
                        {
                            type: 2,
                            label: t("keyword_commands", locale),
                            emoji: "🔎".emoji(),
                            url: urls.saphireSiteUrl + "/commands",
                            style: ButtonStyle.Link
                        }
                    ]
                }
            ]
        });
    }
};