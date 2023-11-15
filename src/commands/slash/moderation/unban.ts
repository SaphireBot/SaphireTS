import { ApplicationCommandOptionType, PermissionFlagsBits, ApplicationCommandType, ChatInputCommandInteraction, Routes, APIUser, User } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import { t } from "../../../translator";
import { bans } from "../../../structures/interaction/autocomplete/unban";
import list from "../../functions/unban/list";

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
        name: "unban",
        name_localizations: getLocalizations("unban.name"),
        description: "[moderation] Unban a user",
        description_localizations: getLocalizations("unban.description"),
        default_member_permissions: PermissionFlagsBits.BanMembers.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "remove",
                name_localizations: getLocalizations("unban.options.0.name"),
                description: "Select a banned user to unban",
                description_localizations: getLocalizations("unban.options.0.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        name_localizations: getLocalizations("unban.options.0.options.0.name"),
                        description: "Select a banned user to unban",
                        description_localizations: getLocalizations("unban.options.0.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        autocomplete: true,
                        required: true
                    },
                    {
                        name: "reason",
                        name_localizations: getLocalizations("unban.options.0.options.1.name"),
                        description: "The unban's reason",
                        description_localizations: getLocalizations("unban.options.0.options.1.description"),
                        type: ApplicationCommandOptionType.String,
                        max_length: 100
                    }
                ]
            },
            {
                name: "list",
                name_localizations: getLocalizations("unban.options.1.name"),
                description: "A list with all users banned",
                description_localizations: getLocalizations("unban.options.1.description"),
                type: ApplicationCommandOptionType.Subcommand,
            }
        ]
    },
    additional: {
        category: "moderation",
        admin: false,
        staff: false,
        api_data: {
            name: "unban",
            description: "Retire o banimento de um usuário no servidor",
            category: "Moderação",
            synonyms: [],
            tags: [],
            perms: {
                user: [DiscordPermissons.BanMembers],
                bot: [DiscordPermissons.BanMembers]
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { user, options, guild, member, userLocale: locale } = interaction;


            if (!member?.permissions.has(PermissionFlagsBits.BanMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

            if (!member?.permissions.has(PermissionFlagsBits.BanMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

            if (options.getSubcommand() === "list") return await list(interaction);
            const query = options.getString("user")!;
            const reason = options.getString("reason") || t("unban.no_reason_given", guild.preferredLocale || "en-US");

            await interaction.reply({ content: t("unban.loading", { e, locale }) });

            const userBanned = await client.rest.get(Routes.user(query)).catch(() => null) as APIUser | null;

            if (!userBanned)
                return await interaction.editReply({ content: t("unban.no_user_found", { e, locale }) });

            const unban = await guild.bans.remove(userBanned?.id, `${user.username}: ${reason.limit(100)}`)
                .catch(err => err?.code as number) as User | null | number | string;

            if (unban === null)
                return await interaction.editReply({
                    content: t("unban.no_response", { e, locale, user: userBanned })
                });

            if (
                typeof unban === "number"
                || typeof unban === "string"
            ) {

                // User not banned
                if (unban === 10026)
                    return await interaction.editReply({ content: t("unban.user_is_not_banned", { e, locale, user: userBanned }) });

                if (unban === "BanResolveId")
                    return await interaction.editReply({ content: t("unban.no_user_unban", { e, locale }) });

                return await interaction.editReply({ content: t("unban.fail", { e, locale, unban, user: userBanned }) });
            }

            const bansCached = bans.get(guild.id);

            if (bansCached?.length) {
                bansCached.filter(ban => ban.user.id !== unban.id);
                bans.set(guild.id, bansCached);
            }

            return await interaction.editReply({ content: t("unban.success", { e, locale, user: unban, reason }) });
        }
    }
};