import { ApplicationCommandType, ChatInputCommandInteraction, Colors, PermissionFlagsBits } from "discord.js";
import { e } from "../../../util/json";
import client from "../../../saphire/index";
import Database from "../../../database";
import { getLocalizations } from "../../../util/getlocalizations";
import { t } from "../../../translator";
import { getSetPrefixButtons } from "../../components/buttons/buttons.get";

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
                return await interaction.reply({ content: t("Discord.Permissions_missing", { e, locale: interaction.userLocale }) });

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
                components: getSetPrefixButtons(interaction.user.id, interaction.userLocale)
            });
        }
    }
};