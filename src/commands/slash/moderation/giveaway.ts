import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, PermissionsBitField, ChannelType } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
// import { e } from "../../../util/json";
// import { t } from "../../../translator";
import { DiscordPermissons } from "../../../util/constants";
import create from "./giveaway/createGiveaway";
import list from "./giveaway/list";
import reroll from "./giveaway/rerrol";
import option from "./giveaway/options";
import finish from "./giveaway/finish";

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
        name: "giveaway",
        name_localizations: getLocalizations("giveaway.name"),
        description: "[moderation] Create and manage giveaway in guild",
        description_localizations: getLocalizations("giveaway.description"),
        default_member_permissions: PermissionsBitField.Flags.ManageEvents.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "create",
                name_localizations: getLocalizations("giveaway.options.0.name"),
                description: "[moderation] Create a new giveaway",
                description_localizations: getLocalizations("giveaway.options.0.description"),
                type: 1,
                options: [
                    {
                        name: "prize",
                        name_localizations: getLocalizations("giveaway.options.0.options.0.name"),
                        description: "Giveaway's Prize (2~150 Character)",
                        description_localizations: getLocalizations("giveaway.options.0.options.0.description"),
                        min_length: 2,
                        max_length: 150,
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: "time",
                        name_localizations: getLocalizations("giveaway.options.0.options.1.name"),
                        description: "When is the draw due? (Ex: 1d 2h 3m) (Limit: 5 second ~ 2 years)",
                        description_localizations: getLocalizations("giveaway.options.0.options.1.description"),
                        max_length: 100,
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: "channel",
                        name_localizations: getLocalizations("giveaway.options.0.options.2.name"),
                        description: "The giveaway's channel",
                        description_localizations: getLocalizations("giveaway.options.0.options.2.description"),
                        type: ApplicationCommandOptionType.Channel,
                        required: true,
                        channel_types: [
                            ChannelType.GuildAnnouncement,
                            ChannelType.PublicThread,
                            ChannelType.PrivateThread,
                            ChannelType.AnnouncementThread,
                            ChannelType.GuildText,
                            ChannelType.GuildForum,
                            ChannelType.GuildVoice,
                            ChannelType.GuildStageVoice
                        ]
                    },
                    {
                        name: "winners",
                        name_localizations: getLocalizations("giveaway.options.0.options.3.name"),
                        description: "Amount of winners",
                        description_localizations: getLocalizations("giveaway.options.0.options.3.description"),
                        type: ApplicationCommandOptionType.Integer,
                        max_value: 250,
                        min_value: 1,
                        required: true
                    },
                    {
                        name: "requires",
                        name_localizations: getLocalizations("giveaway.options.0.options.4.name"),
                        description: "What are the requirements for this giveaway?",
                        description_localizations: getLocalizations("giveaway.options.0.options.4.description"),
                        max_length: 1024,
                        type: ApplicationCommandOptionType.String,
                    },
                    {
                        name: "imageurl",
                        name_localizations: getLocalizations("giveaway.options.0.options.5.name"),
                        description: "An URL from an image to show in giveaway",
                        description_localizations: getLocalizations("giveaway.options.0.options.5.description"),
                        type: ApplicationCommandOptionType.String,
                    },
                    {
                        name: "color",
                        name_localizations: getLocalizations("giveaway.options.0.options.6.name"),
                        description: "The embed's colors",
                        description_localizations: getLocalizations("giveaway.options.0.options.6.description"),
                        type: ApplicationCommandOptionType.Integer,
                        autocomplete: true
                    },
                    {
                        name: "sponsor",
                        name_localizations: getLocalizations("giveaway.options.0.options.7.name"),
                        description: "Who's the sponsor?",
                        description_localizations: getLocalizations("giveaway.options.0.options.7.description"),
                        type: ApplicationCommandOptionType.User
                    },
                    {
                        name: "account_days",
                        name_localizations: getLocalizations("giveaway.options.0.options.8.name"),
                        description: "Minimum number of days with the created account",
                        description_localizations: getLocalizations("giveaway.options.0.options.8.description"),
                        type: ApplicationCommandOptionType.Integer,
                        min_value: 0
                    },
                    {
                        name: "server_days",
                        name_localizations: getLocalizations("giveaway.options.0.options.9.name"),
                        description: "Minimum number of days within the server",
                        description_localizations: getLocalizations("giveaway.options.0.options.9.description"),
                        type: ApplicationCommandOptionType.Integer,
                        min_value: 0
                    }
                ]
            },
            {
                name: "list",
                name_localizations: getLocalizations("giveaway.options.1.name"),
                description: "[moderation] A list with all giveaways",
                description_localizations: getLocalizations("giveaway.options.1.description"),
                type: 1
            },
            {
                name: "reroll",
                name_localizations: getLocalizations("giveaway.options.2.name"),
                description: "[moderation] Reroll a giveaway",
                description_localizations: getLocalizations("giveaway.options.2.description"),
                type: 1,
                options: [
                    {
                        name: "giveaway",
                        name_localizations: getLocalizations("giveaway.options.2.options.0.name"),
                        description: "The giveaway's ID (The giveaway's message ID)",
                        description_localizations: getLocalizations("giveaway.options.2.options.0.name"),
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: "winners",
                        name_localizations: getLocalizations("giveaway.options.2.options.1.name"),
                        description: "Amount of winners to reroll (1 ~ 250)",
                        description_localizations: getLocalizations("giveaway.options.2.options.1.description"),
                        type: ApplicationCommandOptionType.Integer,
                        min_value: 1,
                        max_value: 250,
                        required: true
                    }
                ]
            },
            {
                name: "options",
                name_localizations: getLocalizations("giveaway.options.3.name"),
                description: "[moderation] Additional options and functions",
                description_localizations: getLocalizations("giveaway.options.3.description"),
                type: 1,
                options: [
                    {
                        name: "method",
                        name_localizations: getLocalizations("giveaway.options.3.options.0.name"),
                        description: "Chooose some method to use",
                        description_localizations: getLocalizations("giveaway.options.3.options.0.description"),
                        type: 3,
                        required: true,
                        choices: [
                            {
                                name: "Delete",
                                name_localizations: getLocalizations("giveaway.options.3.options.0.choices.0.name"),
                                value: "delete"
                            },
                            {
                                name: "Reset",
                                name_localizations: getLocalizations("giveaway.options.3.options.0.choices.1.name"),
                                value: "reset"
                            },
                            {
                                name: "Forçar Finalização",
                                name_localizations: getLocalizations("giveaway.options.3.options.0.choices.2.name"),
                                value: "finish"
                            },
                            {
                                name: "Ver Informações",
                                name_localizations: getLocalizations("giveaway.options.3.options.0.choices.3.name"),
                                value: "info"
                            }
                        ]
                    },
                    {
                        name: "giveaway",
                        name_localizations: getLocalizations("giveaway.options.3.options.1.name"),
                        description: "The giveaway's ID (The giveaway's message ID)",
                        description_localizations: getLocalizations("giveaway.options.3.options.1.description"),
                        type: 3,
                        required: true,
                        autocomplete: true
                    }
                ]
            }
        ]
    },
    additional: {
        category: "moderation",
        admin: false,
        staff: false,
        api_data: {
            description: "Gerencie os sorteios do seu servidor",
            category: "Moderação",
            synonyms: ["sorteio", "抽選", "tirage", "auslosung"],
            tags: [],
            perms: {
                user: [DiscordPermissons.ManageEvents],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { options } = interaction;
            const subCommand = options.getSubcommand();

            switch (subCommand) {
                case "create": create(interaction); break;
                case "list": list(interaction); break;
                case "finsih": finish(interaction); break;
                case "reroll": reroll(interaction, options.getString("giveaway") || undefined); break;
                case "options": option(interaction); break;
            }

            return;

        }
    }
};