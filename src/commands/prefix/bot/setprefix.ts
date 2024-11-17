import { Colors, PermissionFlagsBits, Message, ButtonStyle } from "discord.js";
import { e } from "../../../util/json";
import Database from "../../../database";
import { t } from "../../../translator";
import { getSetPrefixButtons } from "../../components/buttons/buttons.get";

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
            bot: [],
        },
    },
    async execute(message: Message, args?: string[]) {

        if (!message.guild || !message.guildId)
            return await message.reply({
                content: t("System_no_data_recieved", {
                    locale: message.userLocale,
                    e,
                }),
            });

        if (
            [
                "me",
                "ich",
                "eu",
                "i",
                "yo",
                "je",
                "私",
            ].includes(args?.[0]?.toLowerCase() || "")
        ) {

            const prefixes = (await Database.getUser(message.author.id))?.Prefixes || [];

            return await message.reply({
                content: t(prefixes.length > 0
                    ? "prefix.my_prefixes"
                    : "prefix.no_prefixes", {
                    e,
                    locale: message.userLocale,
                    prefixes: prefixes.map(prefix => `\`${prefix}\``).join(" & "),
                }),
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("prefix.set_my_prefix", message.userLocale),
                                emoji: e.Animated.SaphireReading.emoji(),
                                custom_id: JSON.stringify({ c: "prefix", src: "user" }),
                                style: ButtonStyle.Primary,
                            },
                        ],
                    },
                ],
            });
        }

        if (!message.member?.permissions.any(PermissionFlagsBits.ManageGuild, true))
            return await message.reply({ content: t("Discord_Permissions_missing", { e, locale: message.userLocale }) });

        const availablePrefix = await Database.getPrefix({ guildId: message.guildId });
        const locale = message.userLocale;

        return await message.reply({
            embeds: [{
                color: Colors.Blue,
                title: `${e.Animated.SaphireReading} ${message.guild.name} ${t("keyword_prefix", locale)}`,
                description: `${e.saphirePolicial} ${t("messageCreate_botmention_embeds[0]_description", locale)}` + "\n \n" + availablePrefix.map((prefix, i) => `${i + 1}. **${prefix}**`).join("\n") || "OMG!",
                fields: [
                    {
                        name: e.Info + " " + t("messageCreate_botmention_embeds[0]_fields[0]_name", locale),
                        value: t("messageCreate_botmention_embeds[0]_fields[0]_value", locale),
                    },
                ],
            }],
            components: getSetPrefixButtons(message.author.id, message.userLocale),
        });
    },
};