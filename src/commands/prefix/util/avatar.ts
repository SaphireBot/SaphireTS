import { APIEmbed, Colors, Message, User, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { avatarSelectMenu } from "../../components/buttons/buttons.get";
import { members } from "../../../database/cache";

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
    execute: async function (message: Message<true>, args: string[]) {

        const { userLocale: locale, author } = message;

        const users = args?.length ? await message.getMultipleUsers() : [author];
        if (users?.length > 25) users.length = 25;

        if (!users?.length)
            return await message.reply({
                content: t("avatar.nobody_found", { e, locale })
            });

        const embeds: APIEmbed[][] = [];

        for await (const user of users)
            embeds.push(await build(user));

        const components = embeds.length > 1
            ? avatarSelectMenu(
                "menu",
                t("avatar.select_menu_placeholder", { locale, users }),
                users
                    .map(u => ({
                        value: u?.id as string,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        label: u?.global_name as string || u?.globalName as string || u?.username as string,
                        emoji: u?.bot ? e.Bot : "👤"
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

                const embeds = await build(users.find(u => u?.id === int.values[0]));
                return await int.update({ embeds: embeds });
            })
            .on("end", async (): Promise<any> => await msg.edit({ components: [] }).catch(() => { }));

        async function build(user: User | undefined | null): Promise<APIEmbed[]> {

            if (!user)
                return [{
                    color: Colors.Blue,
                    image: { url: "https://i.pinimg.com/originals/36/72/34/36723405ae6788b18a972c68ce414b04.gif" }
                }];

            if ("fetch" in user)
                await user.fetch();

            const member = members.get(user.id) || await message.guild.members.fetch(user.id);
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
                    image: { url: "https://i.pinimg.com/originals/36/72/34/36723405ae6788b18a972c68ce414b04.gif" }
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