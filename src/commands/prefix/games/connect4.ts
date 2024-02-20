import { ButtonStyle, Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default {
    name: "connect4",
    description: "[game] The classic Connect4 game, on Discord",
    aliases: [],
    category: "games",
    api_data: {
        category: "Diversão",
        synonyms: [],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { userLocale: locale, author, guild } = message;
        await message.parseMemberMentions();

        if (!args?.[0])
            return await message.reply({
                content: t("connect4.select_a_valid_member", { e, locale })
            });

        const member = guild.members.searchBy(args[0]);
        const memberLocale = (await member?.user.locale()) || locale;

        if (!member || member.user.bot || member.id === author.id)
            return await message.reply({
                content: t("connect4.select_a_valid_member", { e, locale })
            });

        return await message.reply({
            content: memberLocale === locale
                ? t("connect4.ask_for_an_party", { e, locale, member, user: author })
                : `${t("connect4.ask_for_an_party", { e, locale: memberLocale, member, user: author })}` + `\n${t("connect4.ask_for_an_party", { e, locale, member, user: author })}`,
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        label: t("keyword_accept", memberLocale),
                        emoji: e.amongusdance,
                        custom_id: JSON.stringify({ c: "connect", src: "init", userId: member.id, authorId: author.id }),
                        style: ButtonStyle.Success
                    },
                    {
                        type: 2,
                        label: t("keyword_refuse", memberLocale),
                        emoji: "<a:a_hello:937498373727080480>",
                        custom_id: JSON.stringify({ c: "connect", src: "cancel", userId: member.id, authorId: author.id }),
                        style: ButtonStyle.Danger
                    },
                    {
                        type: 2,
                        label: t("connect4.how_to_play", memberLocale),
                        emoji: "❔",
                        custom_id: JSON.stringify({ c: "connect", src: "info" }),
                        style: ButtonStyle.Primary
                    }
                ]
            }].asMessageComponents()
        });
    }
};