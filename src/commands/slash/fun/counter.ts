// import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
// import client from "../../../saphire";
// import { getLocalizations } from "../../../util/getlocalizations";
// import { e } from "../../../util/json";
// import { t } from "../../../translator";
// const counter = () => Math.floor(Math.random() * 100);

// /**
//  * https://discord.com/developers/docs/interactions/application-commands#application-command-object
//  * https://discord.com/developers/docs/reference#locales
//  * "id" and "version" not used here
//  */
// export default {
//     data: {
//         type: ApplicationCommandType.ChatInput,
//         application_id: client.user?.id,
//         guild_id: "",
//         name: "counter",
//         name_localizations: getLocalizations("counter.name"),
//         description: "[fun] A funny way to measure your friends",
//         description_localizations: getLocalizations("counter.description"),
//         default_member_permissions: undefined,
//         dm_permission: false,
//         nsfw: false,
//         options: [
//             {
//                 name: "key",
//                 name_localizations: getLocalizations("counter.options.0.name"),
//                 description: "Choose a key",
//                 description_localizations: getLocalizations("counter.options.0.description"),
//                 type: ApplicationCommandOptionType.String,
//                 choices: [
//                     {
//                         name: "Pervert",
//                         name_localizations: getLocalizations("counter.options.0.choices.0"),
//                         value: "pervert"
//                     },
//                     {
//                         name: "Bull",
//                         name_localizations: getLocalizations("counter.options.0.choices.1"),
//                         value: "bull"
//                     },
//                     {
//                         name: "Gay",
//                         name_localizations: getLocalizations("counter.options.0.choices.2"),
//                         value: "gay"
//                     },
//                     {
//                         name: "Idiot",
//                         name_localizations: getLocalizations("counter.options.0.choices.3"),
//                         value: "idiot"
//                     },
//                     {
//                         name: "Horn",
//                         name_localizations: getLocalizations("counter.options.0.choices.4"),
//                         value: "horn"
//                     },
//                     {
//                         name: "Faithful",
//                         name_localizations: getLocalizations("counter.options.0.choices.5"),
//                         value: "faithful"
//                     },
//                     {
//                         name: "Inteligence",
//                         name_localizations: getLocalizations("counter.options.0.choices.6"),
//                         value: "inteligence"
//                     },
//                 ],
//                 required: true
//             },
//             {
//                 name: "member",
//                 name_localizations: getLocalizations("counter.options.1.name"),
//                 description: "Choose a member",
//                 description_localizations: getLocalizations("counter.options.1.description"),
//                 type: ApplicationCommandOptionType.User,
//                 required: true
//             }
//         ]
//     },
//     additional: {
//         category: "fun",
//         admin: false,
//         staff: false,
//         api_data: {
//             name: "medidor",
//             description: "Um jeito divertido de medir seus amigos",
//             category: "Diversão",
//             synonyms: Array.from(
//                 new Set(
//                     Object.values(
//                         getLocalizations("counter.name") || {}
//                     )
//                 )
//             ),
//             tags: [],
//             perms: {
//                 user: [],
//                 bot: []
//             }
//         },
//         async execute(interaction: ChatInputCommandInteraction<"cached">) {

//             const { userLocale: locale, options, user } = interaction;
//             const key = options.getString("key");
//             const member = options.getMember("member");

//             return await interaction.reply({
//                 content: t(`counter.key.${key}`, { e, locale, member: `<@${member?.id || user.id}>`, counter: counter() }),
//                 allowedMentions: {
//                     parse: [],
//                     users: []
//                 }
//             });
//         }
//     }
// };