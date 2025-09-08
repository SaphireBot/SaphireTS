import { ButtonInteraction, ButtonStyle, Collection, GuildMember, MessageFlags, Role } from "discord.js";
import Database from "../../../database";
import { TeamsData } from "../../../@types/commands";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { moderationPermissions } from "../../../managers/autorole/manager";

export default async function giveawayTeams(interaction: ButtonInteraction<"cached">) {

  const { message, userLocale: locale, guildId, guild, channel, member } = interaction;
  const data = await Database.Games.get(`Teams.${guildId}.${message.id}`) as TeamsData | undefined;

  if (!data)
    return await message.delete().catch(() => { });

  try {

    await interaction.update({
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              emoji: e.Loading.emoji(),
              custom_id: "loading",
              style: ButtonStyle.Primary,
              disabled: true,
            },
          ],
        },
      ],
    });
    await sleep(2500);

    const guildRoles = await guild.roles.fetch().catch(() => { });

    if (!guildRoles?.size) {
      await message.delete().catch(() => { });
      return await interaction.followUp({
        content: t("teams.unknowm_roles", { e, locale }),
      });
    }

    const roles = new Collection<string, Role>();

    for (const roleId of data.roles) {
      const role = guildRoles.get(roleId);
      if (role) roles.set(role.id, role);
    }

    if (roles.size !== data.roles.length) {
      await message.delete().catch(() => { });
      return await interaction.followUp({
        content: t("teams.information_corrupted", { e, locale }),
      });
    }

    const unavailableRoles = roles.filter(r => r.permissions.any(moderationPermissions, true) || r.managed || !r.editable || r.comparePositionTo(member.roles.highest) >= 1);

    if (unavailableRoles.size) {
      await message.delete().catch(() => { });
      return await interaction.followUp({
        content: t("teams.unavailableRole", {
          e,
          locale,
          roles: Array.from(unavailableRoles.values()).join(", "),
        })
          .limit("MessageContent"),
        allowedMentions: {
          roles: [],
        },
      });
    }

    for (const roleId of unavailableRoles.keys())
      roles.delete(roleId);

    if (!roles.size) {
      await message.delete().catch(() => { });
      return await interaction.followUp({
        content: t("teams.information_corrupted", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (roles.size < 2 || roles.size > 25) {
      await message.delete().catch(() => { });
      return await interaction.followUp({
        content: t("teams.information_corrupted", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });
    }

    const participants = await Promise.all(data.participants?.map(id => guild.members.fetch(id).catch(() => null)));
    const members = new Collection<string, GuildMember>();

    for (const member of participants)
      if (member) members.set(member.id, member);

    if (members.size !== participants.length) {
      await message.delete().catch(() => { });
      return await interaction.followUp({
        content: t("teams.information_corrupted", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });
    }

    const teams: Record<string, GuildMember[]> = {};

    for (const role of roles.values())
      teams[role.id] = [];

    while (members.size)
      for (const role of roles.values()) {
        const member = members.random()!;
        if (!member) continue;
        members.delete(member.id);
        teams[role.id].push(member);
      }

    for await (const role of roles.values()) {

      if (teams[role.id].length) {
        const members: GuildMember[] = [];
        for await (const member of teams[role.id])
          await member.roles.add(role.id)
            .then(() => members.push(member))
            .catch(() => { });

        await channel?.send({
          embeds: [{
            color: Number(role.hexColor.replace("#", "0x")),
            title: t("teams.embed.team_title", {
              emoji: role.unicodeEmoji ? `${role.unicodeEmoji} ` : "",
              role,
              locale,
            }),
            description: teams[role.id].join(", ").limit("EmbedDescription"),
          }],
        })
          .catch(() => { });
      }
      await sleep(1000);
    }

    return await message.delete().catch(() => { });

  } catch (_) {
    console.log(_);
    return await message.delete().catch(() => { });
  }
}