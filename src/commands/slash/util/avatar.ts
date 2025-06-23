import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Colors, UserContextMenuCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";

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
        name: "avatar",
        name_localizations: getLocalizations("avatar.name"),
        description: "See the user's avatar. From everywhere/everyone.",
        description_localizations: getLocalizations("avatar.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: "user",
                name_localizations: getLocalizations("avatar.options.0.name"),
                description: "Select an user to see their avatar",
                description_localizations: getLocalizations("avatar.options.0.description"),
                type: ApplicationCommandOptionType.User
            },
            {
                name: "show",
                name_localizations: getLocalizations("avatar.options.1.name"),
                description: "Hide the message just for me",
                description_localizations: getLocalizations("avatar.options.1.description"),
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "Show just to me",
                        name_localizations: getLocalizations("avatar.options.1.choices.0"),
                        value: "yes"
                    },
                    {
                        name: "Show to everyone",
                        name_localizations: getLocalizations("avatar.options.1.choices.1"),
                        value: "no"
                    }
                ]
            }
        ]
    },
    additional: {
        category: "util",
        admin: false,
        staff: false,
        api_data: {
            name: "avatar",
            description: "Veja o avatar de algum usuário",
            category: "Utilidades",
            synonyms: ["avatar", "アバター"],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction) {

            const { userLocale: locale } = interaction;

            await interaction.reply({
                content: `${e.Loading} | ...`,
                ephemeral: interaction instanceof ChatInputCommandInteraction
                    ? interaction.options.getString("show") === "yes"
                    : interaction instanceof UserContextMenuCommandInteraction
            });

            const [user, member] = [
                interaction instanceof ChatInputCommandInteraction
                ? interaction.options.getUser("user") || interaction.user
                : interaction.targetUser,
                interaction instanceof ChatInputCommandInteraction
                ? user.id === interaction.user.id
                    ? interaction.member
                    : interaction.options.getMember("user")
                : interaction.targetMember
            ];

            await user.fetch().catch(() => { });
            if (member && "partial" in member) await member.fetch();
            const userAvatarURL = user.avatar && `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar?.includes("a_") ? "gif" : "png"}?size=2048`;

            const memberAvatarURL = (
                interaction.guild?.id
                && member?.avatar
            ) && `https://cdn.discordapp.com/guilds/${interaction.guild.id}/users/${user.id}/avatars/${member.avatar}.${member.avatar?.includes("a_") ? "gif" : "png"}?size=2048`;

            const bannerUrl = user.banner && `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner?.includes("a_") ? "gif" : "png"}?size=2048`;

            const embeds = [];

            if (typeof userAvatarURL === "string")
                embeds.push({
                    color: Colors.Blue,
                    description: t("avatar.user_url", { locale, e, userAvatarURL, user }),
                    image: { url: userAvatarURL }
                });

            if (typeof memberAvatarURL === "string")
                embeds.push({
                    color: Colors.Blue,
                    description: t("avatar.member_url", { locale, e, memberAvatarURL, member }),
                    image: { url: memberAvatarURL }
                });

            if (typeof bannerUrl === "string")
                embeds.push({
                    color: Colors.Blue,
                    description: t("avatar.banner_url", { locale, e, bannerUrl, user }),
                    image: { url: bannerUrl }
                });

            return await interaction.editReply({ content: null, embeds: [...embeds] }).catch(() => { });
        }
    }
};
