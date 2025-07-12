import { Colors, Message, StringSelectMenuInteraction, ButtonStyle, ButtonInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { avatarSelectMenu } from "../../components/buttons/buttons.get";
import { urls } from "../../../util/constants";
import embedAvatarBuild from "./avatar/embed.build";
const aliases = ["pfp", "icon", "picture", "icone", "ícone"];

export default {
    name: "avatar",
    description: "[util] See the user's avatar. From everywhere/everyone.",
    aliases,
    category: "util",
    api_data: {
        category: "Utilidades",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        let locale = message.userLocale;
        const author = message.author;

        const users = await message.parseUserMentions();
        const members = await message.parseMemberMentions();

        if (members.size > users.size)
            for (const [memberId, member] of members)
                if (!users.has(memberId))
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

        if (!users?.size && !args?.length) {
            users.set(message.author.id, message.author);
            if (message.member) members.set(message.author.id, message.member);
        }

        const embeds = await embedAvatarBuild(users, members, message.guildId, locale);

        if (!embeds.size)
            return await message.reply({
                content: t("avatar.nobody_found", { e, locale }),
            });

        function selectMenu() {
            if (embeds.size > 1)
                return avatarSelectMenu(
                    "menu",
                    t("avatar.select_menu_placeholder", { locale, users: { length: users.size } }),
                    users
                        .map(u => ({
                            value: u.id as string,
                            label: u.displayName,
                            emoji: u.bot ? e.Bot : "👤",
                        })),
                );
            else return [];
        }

        const components = selectMenu();
        if (embeds.size || embeds.first()?.compiler.length)
            components.push({
                type: 1,
                components: [
                    {
                        type: 2,
                        label: t("avatar.decompiler", locale),
                        custom_id: "switchCompiler",
                        emoji: "📚",
                        style: ButtonStyle.Primary,
                    },
                ],
            } as any);

        const msg = await message.reply({
            embeds: embeds.first()!.compiler,
            components,
        });

        let embedViewType: "decompiler" | "compiler" = "compiler";
        let lastId = embeds.firstKey()!;
        return msg.createMessageComponentCollector({
            filter: int => int.user.id === author.id,
            idle: 1000 * 60 * 4,
        })
            .on("collect", async (int: StringSelectMenuInteraction<"cached"> | ButtonInteraction<"cached">): Promise<any> => {
                locale = int.userLocale;
                if (int instanceof StringSelectMenuInteraction) {

                    const embed = embeds.get(int.values[0]);
                    lastId = int.values[0];
                    if (!embed)
                        return await int.update({
                            embeds: [{
                                color: Colors.Blue,
                                description: t("avatar.no_image_found", { e, locale }),
                                image: { url: urls.not_found_image },
                            }],
                        }).catch(() => { });

                    return await int.update({
                        embeds: embed[embedViewType],
                    });
                }

                const trade = embedViewType === "compiler" ? "decompiler" : "compiler";
                const embed = embeds.get(lastId)!;

                await int.update({
                    embeds: embed[trade],
                    components: [
                        selectMenu(),
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    label: t(`avatar.${trade === "compiler" ? "decompiler" : "compiler"}`, locale),
                                    custom_id: "switchCompiler",
                                    emoji: trade === "compiler" ? "📚" : "🖼️",
                                    style: ButtonStyle.Primary,
                                },
                            ],
                        },
                    ].filter(Boolean).flat(),
                }).catch(() => { });

                return embedViewType = trade;
            })
            .on("end", async (): Promise<any> => await msg.edit({ components: [] }).catch(() => { }));

    },
};