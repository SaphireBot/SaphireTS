import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Colors } from "discord.js";
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
            synonyms: [""],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { userLocale: locale } = interaction;

            await interaction.reply({
                content: t("avatar.loading", { e, locale }),
                ephemeral: interaction.options.getString("show") === "yes"
            });

            const user = interaction.options.getUser("user") || interaction.user;
            const member = user.id === interaction.user.id ? interaction.member : interaction.options.getMember("user");

            await user.fetch().catch(() => { });
            if (member?.partial) await member.fetch();
            const userAvatarURL = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar?.includes("a_") ? "gif" : "png"}?size=2048` : null;
            const memberAvatarURL = member?.avatar ? `https://cdn.discordapp.com/guilds/${interaction.guild.id}/users/${user.id}/avatars/${member.avatar}.${member.avatar?.includes("a_") ? "gif" : "png"}?size=2048` : null;
            const bannerUrl = user.banner ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner?.includes("a_") ? "gif" : "png"}?size=2048` : null;

            const embeds = [];

            if (userAvatarURL)
                embeds.push({
                    color: Colors.Blue,
                    description: t("avatar.user_url", { locale, e, userAvatarURL, user }),
                    image: { url: userAvatarURL }
                });

            if (memberAvatarURL)
                embeds.push({
                    color: Colors.Blue,
                    description: t("avatar.member_url", { locale, e, memberAvatarURL, member }),
                    image: { url: memberAvatarURL }
                });

            if (bannerUrl)
                embeds.push({
                    color: Colors.Blue,
                    description: t("avatar.banner_url", { locale, e, bannerUrl, user }),
                    image: { url: bannerUrl }
                });

            return await interaction.editReply({ content: null, embeds: [...embeds] }).catch(() => { });
        }
    }
};