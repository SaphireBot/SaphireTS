import { APIEmbed, Colors, Message, User, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { avatarSelectMenu } from "../../components/buttons/buttons.get";
import { urls } from "../../../util/constants";

export default {
    name: "avatar",
    description: "[util] See the user's avatar. From everywhere/everyone.",
    aliases: ["pfp", "banner", "icon", "picture"],
    category: "util",
    api_data: {
        category: "Utilidades",
        synonyms: ["pfp", "banner", "icon", "picture"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, _: string[]) {

        const { userLocale: locale, author } = message;

        const users = await message.parseUserMentions();
        const members = await message.parseMemberMentions();

        if (members.size > users.size)
            for (const [memberId, member] of members)
                users.set(memberId, member.user);

        if (users?.size > 25) {
            let i = 0;
            for (const [userId] of users) {
                i++;
                if (i > 25) users.delete(userId);
            }
        }

        if (members?.size > 25) {
            let i = 0;
            for (const [memberId] of members) {
                i++;
                if (i > 25) members.delete(memberId);
            }
        }

        if (!users?.size)
            return await message.reply({
                content: t("avatar.nobody_found", { e, locale })
            });

        const embeds: APIEmbed[][] = await Promise.all(users.map(user => build(user)));

        const components = embeds.length > 1
            ? avatarSelectMenu(
                "menu",
                t("avatar.select_menu_placeholder", { locale, users: { length: users.size } }),
                users
                    .map(u => ({
                        value: u.id as string,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        label: u.displayName,
                        emoji: u.bot ? e.Bot : "👤"
                    }))
            )
            : [];

        const msg = await message.reply({
            embeds: embeds[0],
            components
        });

        if (embeds.length <= 1) return;

        return msg.createMessageComponentCollector({
            filter: int => int.user.id === author.id,
            idle: 1000 * 60 * 4
        })
            .on("collect", async (int: StringSelectMenuInteraction<"cached">): Promise<any> => {

                const embeds = await build(users.get(int.values[0])!);
                return await int.update({ embeds: embeds });
            })
            .on("end", async (): Promise<any> => await msg.edit({ components: [] }).catch(() => { }));

        async function build(user: User): Promise<APIEmbed[]> {

            if (!user)
                return [{
                    color: Colors.Blue,
                    image: { url: urls.not_found_image }
                }];

            if ("fetch" in user && !user?.banner)
                await user.fetch();

            const member = members.get(user.id);
            const userAvatarURL = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar?.includes("a_") ? "gif" : "png"}?size=2048` : null;
            const memberAvatarURL = member?.avatar ? `https://cdn.discordapp.com/guilds/${message.guild.id}/users/${user.id}/avatars/${member.avatar}.${member.avatar?.includes("a_") ? "gif" : "png"}?size=2048` : null;
            const bannerUrl = user.banner ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner?.includes("a_") ? "gif" : "png"}?size=2048` : null;
            const embeds: APIEmbed[] = [];

            if (
                !userAvatarURL
                && !memberAvatarURL
                && !bannerUrl
            )
                return [{
                    color: Colors.Blue,
                    image: { url: urls.not_found_image }
                }];

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

            return embeds;
        }
    }
};