import { AutocompleteInteraction, Routes, APIUser, User } from "discord.js";
import { t } from "../../../translator";
import client from "../../../saphire";
type APIGuildBan = {
    reason: string | null,
    user: APIUser | User
};

export const bans = new Map<string, (APIGuildBan)[]>();
export default async function unban(interaction: AutocompleteInteraction<"cached">, value: string) {

    const { guild, userLocale: locale } = interaction;
    let guildBans = bans.get(guild.id);
    const query = value?.toLowerCase();

    if (!guildBans) {
        const guildBansFetch = await client.rest.get(Routes.guildBans(guild.id)).catch(() => []) as APIGuildBan[];
        if (guildBansFetch?.length) {
            bans.set(guild.id, guildBansFetch);
            guildBans = guildBansFetch;
            setTimeout(() => bans.delete(guild.id), 1000 * 60);
        }
    }

    return await interaction.respond(
        guildBans
            ? guildBans
                .filter((ban) => ban.user.username.toLowerCase().includes(query)
                    || ban.user.id.includes(query)
                    || ban.reason?.toLowerCase().includes(query)
                )
                .map((ban) => ({
                    name: `(${ban.user.id}) ${ban.user.username} - ${ban.reason || t("unban.no_reason_given", locale)}`.limit("AutocompleteName"),
                    value: ban.user.id
                }))
                .slice(0, 25)
            : [{
                name: t("unban.no_ban_autocomplete", locale),
                value: "ignore"
            }]
    );

}