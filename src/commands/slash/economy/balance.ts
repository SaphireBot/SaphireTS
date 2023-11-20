import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";

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
        name: "balance",
        name_localizations: getLocalizations("balance.name"),
        description: "[economy] Check the amount of Safiras. Yours or someone else's",
        description_localizations: getLocalizations("balance.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "user",
                name_localizations: getLocalizations("balance.options.0.name"),
                description: "Select a user to view your Safiras",
                description_localizations: getLocalizations("balance.options.0.description"),
                type: ApplicationCommandOptionType.User,
                required: false
            }
        ]
    },
    additional: {
        category: "balance",
        admin: false,
        staff: false,
        api_data: {
            name: "balance",
            description: "Confira as suas Safiras ou a de alguém",
            category: "Economia",
            synonyms: ["balance", "saldo"],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction) {

            const { options, userLocale: locale } = interaction;
            const user = options.getUser("user") || interaction.user;

            await interaction.reply({ content: t("balance.loading", { e, locale }) });
            const data = await Database.getBalance(user?.id);
            let contentKey: string;

            if (user.id === interaction.user.id) {
                contentKey = data.position > 0
                    ? "render_own"
                    : "render_own_without_ranking";
            } else contentKey = data.position > 0
                ? "render_other"
                : "render_other_without_ranking";

            return await interaction.editReply({
                content: t(`balance.${contentKey}`, {
                    e,
                    locale,
                    balance: data.balance?.currency(),
                    position: data.position?.currency(),
                    user
                })
            });
        }
    }
};