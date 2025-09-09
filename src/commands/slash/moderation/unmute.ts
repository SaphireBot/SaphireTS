import { ApplicationCommandType, PermissionFlagsBits, ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { setTimeout as sleep } from "node:timers/promises";
import { getLocalizations } from "../../../util/getlocalizations";

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
    name: "unmute",
    name_localizations: getLocalizations("unmute.name"),
    description: "[moderation] Unmute members",
    description_localizations: getLocalizations("unmute.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    options: [
      {
        name: "members",
        name_localizations: getLocalizations("unmute.options.0.name"),
        description: "Members to remove the mute",
        description_localizations: getLocalizations("unmute.options.0.description"),
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        name_localizations: getLocalizations("unmute.options.1.name"),
        description: "The unmute's reason",
        description_localizations: getLocalizations("mute.options.1.description"),
        type: ApplicationCommandOptionType.String,
        max_length: 512,
        min_length: 0,
      },
    ],
  },
  additional: {
    category: "moderation",
    admin: false,
    staff: false,
    api_data: {
      name: "unmute",
      description: "Remova unmute dos membros",
      category: "Moderação",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("unmute.name") || {},
          ),
        ),
      ),
      tags: ["new"],
      perms: {
        user: [DiscordPermissons.ModerateMembers],
        bot: [DiscordPermissons.ModerateMembers],
      },
    },
    async execute(interaction: ChatInputCommandInteraction<"cached">) {

      const { userLocale: locale, guild, user, member, options, channelId } = interaction;

      if (!member?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ModerateMembers], "Discord_you_need_some_permissions");

      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
        return await permissionsMissing(interaction, [DiscordPermissons.ModerateMembers], "Discord_client_need_some_permissions");

      await interaction.reply({ content: t("unmute.search_members", { e, locale }) });

      const queries = options.getString("members", true).split(/ /g);
      const reason = options.getString("reason");
      await guild.members.fetch().catch(() => { });
      const members = guild.members.searchBy(queries);

      if (!members?.size)
        return await interaction.editReply({ content: t("unmute.no_members_found", { e, locale }) });

      let content = "";

      if (members.delete(client.user!.id))
        content += `${t("unmute.saphire_mute", { e, locale })}\n`;

      if (members.delete(user.id))
        content += `${t("unmute.you_cannot_mute_you", { e, locale })}\n`;

      if (!members.size && content.length)
        return await interaction.editReply({ content });

      let counter = 0;
      const clientHighestRole = guild.members.me?.roles.highest;
      for await (const member of members.values()) {
        if (!member?.id) continue;

        counter++;
        await interaction.editReply({ content: t("unmute.count", { e, locale, members: { size: members.size }, counter }) }).catch(() => { });

        if (clientHighestRole)
          if (member.roles.highest.comparePositionTo(clientHighestRole) >= 1) {
            content += `${t("unmute.client_no_perm", { e, locale, member })}`;
            await sleep(1500);
            continue;
          }

        if (member.id !== guild.ownerId)
          if (
            member.roles.highest.comparePositionTo(member.roles.highest) >= 1
            || member.permissions.has(PermissionFlagsBits.ModerateMembers, true)
          ) {
            content += `${t("unmute.no_perm", { e, locale, member })}\n`;
            await sleep(1500);
            continue;
          }

        content += member.communicationDisabledUntil
          ? await member.disableCommunicationUntil(null, reason || `Unmuted my ${user.username}`)
            .then(member => `${t("unmute.unmuted", { e, locale, member })}\n`)
            .catch(err => `${t("unmute.unmuted_fail", { e, locale, member, err })}\n`)
          : `${t("unmute.no_muted", { e, locale, member })}\n`;

        if (counter === members.size) break;
        await sleep(1500);
      }

      content = content.limit("MessageContent");
      return await interaction.editReply({
        content,
        allowedMentions: {
          parse: [],
          repliedUser: true,
          roles: [],
          users: [],
        },
      })
        .catch(async () => {
          await client.channels.send(channelId, {
            content,
            allowedMentions: {
              parse: [],
              repliedUser: true,
              roles: [],
              users: [],
            },
          })
            .catch(() => { });
          return;
        });
    },
  },
};