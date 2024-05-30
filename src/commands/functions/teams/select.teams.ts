import { Collection, PermissionFlagsBits, Role, RoleSelectMenuInteraction } from "discord.js";
import modals from "../../../structures/modals";
import { tempRolesId } from "./modal.teams";
import { moderationPermissions } from "../../../managers/autorole/manager";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import permissionsMissing from "../permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";

export default async function selectRolesTeams(interaction: RoleSelectMenuInteraction<"cached">, data: { c: "teams", id: string }) {

  const { userLocale: locale, message, guild, user, values: rolesId, member } = interaction;

  if (user.id !== data?.id)
    return await interaction.reply({
      content: t("ranking.you_cannot_click_here", { e, locale }),
      ephemeral: true
    });

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles, true))
    return await permissionsMissing(message, [DiscordPermissons.ManageRoles], "Discord_client_need_some_permissions");

  const rolesArray = (rolesId.map(id => guild.roles.cache.get(id))?.filter(Boolean) || []) as Role[];
  const roles = new Collection<string, Role>();

  for (const role of rolesArray)
    roles.set(role.id, role);

  const unavailableRoles = roles.filter(r => r.permissions.any(moderationPermissions, true) || r.managed || !r.editable || r.comparePositionTo(member.roles.highest) >= 1);

  if (unavailableRoles.size)
    return await interaction.reply({
      content: t("teams.unavailableRole", {
        e,
        locale,
        roles: Array.from(unavailableRoles.values()).join(", ")
      })
        .limit("MessageContent"),
      ephemeral: true
    });

  tempRolesId.set(message.id, rolesId);
  return await interaction.showModal(modals.defineTeamsParticipants(locale))
    .catch(() => tempRolesId.delete(message.id));
}