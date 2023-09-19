import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import inGuildJokempo from "./jokempo/inGuild";

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
        name: "jokempo",
        name_localizations: {
            "en-US": "rock_paper_scissors",
            "es-ES": "piedra_papel_tijera",
            "fr": "pierre_papier_ciseaux",
            "ja": "じゃんけん",
            // "pt-BR": "jokempo"
        },
        description: "[fun] One of the most played games on Planet Earth.",
        description_localizations: {
            // "en-US": "[fun] One of the most played games on Planet Earth.",
            "es-ES": "[fun] Uno de los juegos más jugados en el Planeta Tierra.",
            "fr": "[fun] L'un des jeux les plus joués sur la Planète Terre.",
            "ja": "[fun] 地球上で最もプレイされているゲームの1つです。",
            "pt-BR": "[fun] Um dos jogos mais jogados no Planeta Terra."
        },
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "versus",
                name_localizations: {
                    // "en-US": "versus",
                    // "es-ES": "versus",
                    // "fr": "versus",
                    "ja": "対",
                    // "pt-BR": "versus"
                },
                description: "[fun] Play against someone on this server.",
                description_localizations: {
                    // "en-US": "[fun] Play against someone on this server.",
                    "es-ES": "[fun] uega contra alguien en este servidor.",
                    "fr": "[fun] Jouez contre quelqu'un sur ce serveur.",
                    "ja": "[fun] このサーバーで誰かと対戦してください。",
                    "pt-BR": "[fun] Jogue contra alguém neste servidor"
                },
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "member",
                        name_localizations: {
                            // "en-US": "member",
                            "es-ES": "miembro",
                            "fr": "membre",
                            "ja": "メンバー",
                            "pt-BR": "membro"
                        },
                        description: "Choose a member (excluding bots and myself) to play against",
                        description_localizations: {
                            // "en-US": "Choose a member (excluding bots and myself) to play against",
                            "es-ES": "Elige un miembro (excluyendo bots y a mí mismo) para jugar contra",
                            "fr": "Choisissez un membre (à l'exception des bots et de moi-même) pour jouer contre",
                            "ja": "対戦相手を選んでください（ボットと私自身を除く）",
                            "pt-BR": "Escolha um membro (exceto bots e você mesmo) para você jogar contra"
                        },
                        type: ApplicationCommandOptionType.User,
                        required: true
                    },
                    {
                        name: "bet",
                        name_localizations: {
                            // "en-US": "bet",
                            "es-ES": "apostar",
                            "fr": "parier",
                            "ja": "賭ける",
                            "pt-BR": "apostar"
                        },
                        description: "Bet an amount of Safiras",
                        description_localizations: {
                            // "en-US": "Bet an amount of Safiras",
                            "es-ES": "Apueste una cantidad de Safiras",
                            "fr": "Misez une quantité de Safiras",
                            "ja": "サファイアの量を賭けてください",
                            "pt-BR": "Aposte uma quantidade de Safiras"
                        },
                        type: ApplicationCommandOptionType.Integer,
                        min_value: 1,
                        max_value: 1_000_000
                    }
                ]
            },
            // {
            //     name: 'global',
            //     description: '[fun] Jogue um jokempo com qualquer outro usuário',
            //     type: ApplicationCommandOptionType.Subcommand,
            //     options: []
            // }
        ],
    },
    additional: {
        category: "games",
        admin: false,
        staff: false,
        api_data: {
            name: "jokempo",
            description: "Um dos jogos mais jogados no Planeta Terra.",
            category: "Jogos",
            synonyms: ["rock_paper_scissors", "piedra_papel_tijera", "pierre_papier_ciseaux", "じゃんけん"],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction) {

            const subCommand = interaction.options.getSubcommand();

            if (subCommand === "versus") return inGuildJokempo(interaction);
            return;
        }
    }
};