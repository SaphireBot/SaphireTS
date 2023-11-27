import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, time } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
import Crash from "../../../structures/crash/crash";

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
        name: "crash",
        description: "[economy] Good luck with crash!",
        description_localizations: getLocalizations("crash.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "amount",
                name_localizations: getLocalizations("crash.options.0.name"),
                description: "How much Sapphires do you want to bet?",
                description_localizations: getLocalizations("crash.options.1.description"),
                min_value: 1,
                type: ApplicationCommandOptionType.Integer,
                required: true,
                autocomplete: true
            },
        ]
    },
    additional: {
        category: "economy",
        admin: false,
        staff: false,
        api_data: {
            name: "crash",
            description: "Boa sorte com o crash!",
            category: "Economia",
            synonyms: [],
            tags: ["new"],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { userLocale: locale, user, channelId, guildId, options } = interaction;
            const value = options.getInteger("amount");

            if (!value)
                return await interaction.reply({
                    content: t("crash.no_arguments_given", { e, locale }),
                    ephemeral: true
                });

            const balance = (await Database.getUser(user.id))?.Balance || 0;

            if (balance <= 0)
                return await interaction.reply({
                    content: t("crash.negative_balance", { e, locale, balance }),
                    ephemeral: true
                });

            if (!value || isNaN(value))
                return await interaction.reply({
                    content: t("crash.value_unknown", { e, locale }),
                    ephemeral: true
                });

            if (balance < value)
                return await interaction.reply({
                    content: t("crash.balance_not_enough", { e, locale, valueNeeded: (value - balance).currency() }),
                    ephemeral: true
                });

            const msg = await interaction.reply({ content: t("crash.loading", { e, locale }), fetchReply: true });
            const crash = new Crash({ channelId, guildId, value, message: msg });
            crash.load();

            return await msg.edit({
                content: t("crash.iniciating_in", { e, locale, time: time(new Date(Date.now() + 15000), "R"), value: value.currency() }),
                components: crash.components
            });
        }
    }
};