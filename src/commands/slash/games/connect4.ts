import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, MessageFlags } from "discord.js";
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
        name: "connect4",
        // name_localizations: getLocalizations("connect4.name"),
        description: "[game] The classic Connect4 game, on Discord",
        description_localizations: getLocalizations("connect4.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "opponent",
                name_localizations: getLocalizations("connect4.options.0.name"),
                type: ApplicationCommandOptionType.User,
                description: "Choose an opponent",
                description_localizations: getLocalizations("connect4.options.0.description"),
                required: true,
            },
        ],
    },
    additional: {
        category: "games",
        admin: false,
        staff: false,
        api_data: {
            name: "connect4",
            description: "O clássico jogo Connect4, só que no Discord",
            category: "Diversão",
            synonyms: [],
            // synonyms: Array.from(
            //     new Set(
            //         Object.values(
            //             getLocalizations("COMMANDNAME.FIELD") || {}
            //         )
            //     )
            // ),
            tags: [],
            perms: {
                user: [],
                bot: [],
            },
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { options, userLocale: locale, user } = interaction;
            const member = options.getMember("opponent");
            const memberLocale = await member?.user.locale() || locale;

            if (!member || member.user.bot || member.id === user.id)
                return await interaction.reply({
                    content: t("connect4.select_a_valid_member", { e, locale }),
                    flags: [MessageFlags.Ephemeral],
                });

            return await interaction.reply({
                content: memberLocale === locale
                    ? t("connect4.ask_for_an_party", { e, locale, member, user })
                    : `${t("connect4.ask_for_an_party", { e, locale: memberLocale, member, user })}` + `\n${t("connect4.ask_for_an_party", { e, locale, member, user })}`,
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("keyword_accept", memberLocale),
                            emoji: e.amongusdance,
                            custom_id: JSON.stringify({ c: "connect", src: "init", userId: member.id, authorId: user.id }),
                            style: ButtonStyle.Success,
                        },
                        {
                            type: 2,
                            label: t("keyword_refuse", memberLocale),
                            emoji: "<a:a_hello:937498373727080480>",
                            custom_id: JSON.stringify({ c: "connect", src: "cancel", userId: member.id, authorId: user.id }),
                            style: ButtonStyle.Danger,
                        },
                        {
                            type: 2,
                            label: t("connect4.how_to_play", memberLocale),
                            emoji: "❔",
                            custom_id: JSON.stringify({ c: "connect", src: "info" }),
                            style: ButtonStyle.Primary,
                        },
                    ],
                }].asMessageComponents(),
            });
        },
    },
};