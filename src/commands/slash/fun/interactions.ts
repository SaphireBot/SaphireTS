import { APIEmbed, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Colors } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { getGifs } from "../../functions/fun/gifs";
import { need_a_member } from "../../prefix/fun/interactions";
import all from "../../functions/fun/all";

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
        name: "interactions",
        name_localizations: getLocalizations("interactions.name"),
        description: "[fun] A super command to interact with another user",
        description_localizations: getLocalizations("interactions.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "gif",
                description: "Choose a gif type",
                description_localizations: getLocalizations("interactions.options.0.description"),
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true
            },
            {
                name: "member",
                name_localizations: getLocalizations("interactions.options.1.name"),
                description: "Choose a member",
                description_localizations: getLocalizations("interactions.options.1.description"),
                type: ApplicationCommandOptionType.User
            },
            {
                name: "message",
                name_localizations: getLocalizations("interactions.options.2.name"),
                description: "Do you want a custom message?",
                description_localizations: getLocalizations("interactions.options.2.description"),
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    additional: {
        category: "fun",
        admin: false,
        staff: false,
        api_data: {
            name: "interações",
            description: "Um super comando para você interagir com outras pessoas",
            category: "Diversão",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("interactions.name") || {}
                    )
                )
            ),
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { options, user: author, userLocale } = interaction;
            const endpoint = options.getString("gif");

            if (
                [
                    "alles",
                    "everything",
                    "todo",
                    "all",
                    "tout",
                    "全て",
                    "一切",
                    "alle",
                    "everyone",
                    "todos",
                    "tous",
                    "みんな",
                    "所有人"
                ]
                    .includes(endpoint || "")
            )
                return await all(interaction);

            if (!endpoint || endpoint === "ignore")
                return await interaction.reply({ content: e.Animated.SaphireSleeping });

            const gifs = await getGifs(endpoint);
            const gif = gifs.gifs?.random();
            if (!gif) return;

            let member = options.getMember("member");
            if (member?.user?.id === author.id) member = null;
            const memberLocale = (await member?.user?.locale()) || userLocale;

            if (need_a_member.includes(gifs.endpoint!) && !member)
                return await interaction.reply({ content: t("interactions.need_a_member", { e, locale: userLocale }), ephemeral: true });

            const message = options.getString("message");

            const embed: APIEmbed = {
                color: Colors.Blue,
                image: { url: gif.url }
            };

            if (gif.anime_name || member)
                embed.footer = {
                    text: `Anime: ${gif.anime_name || "GIF by Tenor"}`
                };

            const msg = await interaction.reply({
                content: message || !member?.user?.id
                    ? message?.limit("EmbedDescription") || ""
                    : (userLocale && memberLocale) && (userLocale === memberLocale)
                        ? t(`interactions.${gifs.endpoint}`, {
                            e,
                            locale: userLocale,
                            author,
                            member: member || author
                        })
                        : `${t(`interactions.${gifs.endpoint}`, {
                            e,
                            locale: userLocale,
                            author,
                            member: member || author
                        })}` + `\n${t(`interactions.${gifs.endpoint}`, {
                            e,
                            locale: memberLocale,
                            author,
                            member: member || author
                        })}`,
                embeds: [embed],
                fetchReply: true
            });

            if (msg.embeds?.[0].description?.includes(`@${member?.id}`) && member)
                await msg.react("🔄").catch(() => { });

            return;
        }
    }
};