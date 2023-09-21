import { ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, Colors, PermissionFlagsBits } from "discord.js";
import { e } from "../../../util/json";
import client from "../../../saphire/index";
import Database from "../../../database";
import { getLocalizations } from "../../../util/getlocalizations";
import { t } from "../../../translator";
import { urls } from "../../../util/constants";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
    data: {
        type: ApplicationCommandType.ChatInput,
        application_id: client.user?.id,
        guild_id: "",
        name: "setprefix",
        name_localizations: getLocalizations("setprefix.name"),
        description: "[util] Define up to 5 prefixes of your choice.",
        description_localizations: getLocalizations("setprefix.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: []
    },
    additional: {
        category: "bot",
        admin: false,
        staff: false,
        api_data: {
            name: "setprefix",
            description: "Defina até 5 prefixos de sua escolha",
            category: "Saphire",
            synonyms: ["setprefix", "prefix", "prefijo", "préfixe", "プレフィクス", "präfix"],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            if (!interaction.guildId)
                return await interaction.reply({
                    content: t("System_no_data_recieved", {
                        locale: interaction.userLocale,
                        e
                    })
                });

            if (!interaction.member?.permissions.any(PermissionFlagsBits.ManageGuild, true))
                return await interaction.reply({ content: t("System_permissions_missing", { e, lcoale: interaction.userLocale }) });

            const availablePrefix = await Database.getPrefix(interaction.guildId);
            const locale = interaction.userLocale;

            return await interaction.reply({
                embeds: [{
                    color: Colors.Blue,
                    title: `${e.Animated.SaphireReading} ${interaction.guild.name} ${t("keyword_prefix", locale)}`,
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
                                custom_id: JSON.stringify({ c: "prefix", uid: interaction.user.id }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: t("keyword_reset", locale),
                                emoji: "🧹".emoji(),
                                custom_id: JSON.stringify({ c: "prefix", uid: interaction.user.id, src: "refresh" }),
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: t("keyword_cancel", locale),
                                emoji: e.Trash.emoji(),
                                custom_id: JSON.stringify({ c: "delete", uid: interaction.user.id }),
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
    }
};