import { AutocompleteInteraction } from "discord.js";
import { t } from "../../../translator";
import { guildsThatHasBeenFetched } from "../../../commands/functions/ban/constants";

export default async function unban(interaction: AutocompleteInteraction<"cached">, value: string) {

    const { guild, userLocale: locale, guildId } = interaction;

    if (!guildsThatHasBeenFetched.has(guildId)) {
        guildsThatHasBeenFetched.add(guildId);
        await guild.bans.fetch().catch((error: Error) => error);
    }

    const bans = guild.bans.cache;
    const query = value?.toLowerCase();

    return await interaction.respond(
        bans
            ? bans
                .filter((ban) => ban.user.username.toLowerCase().includes(query)
                    || ban.user.id.includes(query)
                    || ban.reason?.toLowerCase().includes(query)
                    || (ban.user.globalName && ban.user.globalName?.toLowerCase().includes(query))
                )
                .map((ban) => ({
                    name: `(${ban.user.id}) ${ban.user.username} - ${ban.reason || t("ban.no_reason_given", locale)}`.limit("ApplicationCommandChoiceName"),
                    value: ban.user.id
                }))
                .slice(0, 25)
            : [{
                name: t("ban.no_ban_autocomplete", locale),
                value: "ignore"
            }]
    );

}