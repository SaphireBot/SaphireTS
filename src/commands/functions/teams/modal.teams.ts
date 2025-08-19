import { Collection, Colors, ModalSubmitInteraction, PermissionFlagsBits, Role } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { moderationPermissions } from "../../../managers/autorole/manager";
import Database from "../../../database";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../permissionsMissing";
import { TeamsData } from "../../../@types/commands";
import { buttonsTeams } from "./constants.teams";
export const tempRolesId = new Collection<string, string[]>();

export default async function modalTeams(interaction: ModalSubmitInteraction<"cached">) {

  const { fields, message, userLocale: locale, guild, user, member } = interaction;
  const limit = Number(fields.getTextInputValue("max_participants"));

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_client_need_some_permissions");

  if (typeof limit !== "number" || limit > 100 || limit < 1) {
    tempRolesId.delete(message?.id || "");
    return await interaction.reply({
      content: t("teams.unknowm_number", { e, locale }),
      ephemeral: true,
    });
  }

  const rolesID = tempRolesId.get(message?.id || "") || [];
  const rolesArray = (rolesID?.map(id => guild.roles.cache.get(id))?.filter(Boolean) || []) as Role[];
  const roles = new Collection<string, Role>();

  for (const role of rolesArray)
    roles.set(role.id, role);

  const unavailableRoles = roles.filter(r => r.permissions.any(moderationPermissions, true) || r.managed || !r.editable || r.comparePositionTo(member.roles.highest) >= 1);

  if (unavailableRoles.size)
    return await interaction.reply({
      content: t("teams.unavailableRole", {
        e,
        locale,
        roles: Array.from(unavailableRoles.values()).join(", "),
      })
        .limit("MessageContent"),
      ephemeral: true,
    });

  for (const roleId of unavailableRoles.keys())
    roles.delete(roleId);

  if (!roles.size) {
    tempRolesId.delete(message?.id || "");
    return await interaction.reply({
      content: t("teams.unknowm_roles", { e, locale }),
      ephemeral: true,
    });
  }

  if (roles.size < 2 || roles.size > 25) {
    tempRolesId.delete(message?.id || "");
    return await interaction.reply({
      content: t("teams.roles_limits", { e, locale }),
      ephemeral: true,
    });
  }

  await interaction.deferUpdate().catch(() => { });

  const teams: Record<string, string[]> = {};

  for (const id of roles.keys())
    teams[id] = [];

  return await interaction.editReply({
    content: null,
    embeds: [{
      color: Colors.Blue,
      title: t("teams.embed.title", { e, locale }),
      description: t("teams.no_participants", { e, locale }),
      fields: [
        {
          name: t("teams.embed.fields.0.name", { e, locale }),
          value: t("teams.embed.fields.0.value", locale),
        },
        {
          name: t("teams.embed.fields.1.name", { e, locale }),
          value: Array.from(roles.values())
            .join(", ")
            .limit("EmbedFieldValue"),
        },
        {
          name: t("teams.embed.fields.2.name", { e, locale }),
          value: t("teams.embed.fields.2.value", { locale, limit }),
        },
      ],
    }],
    components: buttonsTeams(locale, user.id, true),
  })
    .then(async msg => {
      await Database.Games.set(`Teams.${guild.id}.${msg.id}`, {
        roles: Array.from(roles.keys()),
        authorId: user.id,
        participants: [],
        teams,
        limit,
      } as TeamsData);
    });

}