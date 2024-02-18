import { GuildMemberRoleManager, Message, Role } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";

export default async function removeRole(message: Message<true>, args: string[]) {

  const { userLocale: locale, author, guildId, guild } = message;

  const queries = args.slice(1).join(" ").match(/[\w\d]+/g)?.map(str => str?.toLowerCase());

  if (!queries?.length)
    return await message.reply({ content: t("role.remove.invalid_params", { e, locale }) });

  const msg = await message.reply({ content: t("role.remove.loading", { e, locale }) });

  const members = message.mentions.members;
  const roles = message.mentions.roles;

  for await (const query of queries) {
    if (members.has(query) || roles.has(query)) continue;

    const member = guild.members.cache.find(m => m.id === query || m.user.username?.toLowerCase() === query || m.displayName?.toLowerCase() === query)
      || (
        query.isDiscordId()
          ? await guild.members.fetch(query).catch(() => null)
          : null
      );

    if (member?.id) {
      members.set(member.id, member);
      continue;
    }

    const role = guild.roles.cache.find(r => r.id === query || r.name?.toLowerCase() === query)
      || (
        query.isDiscordId()
          ? await guild.roles.fetch(query).catch(() => null)
          : null
      );

    if (role?.id) {
      roles.set(role.id, role);
      continue;
    }
  }

  if (!roles.size)
    return await msg.edit({ content: t("role.remove.no_roles_mentioned", { e, locale }) });

  if (!members.size)
    return await msg.edit({ content: t("role.remove.no_members_mentioned", { e, locale }) });

  const res = {
    noPermissions: [] as Role[],
    hasEveryone: roles.delete(guildId),
    membersSucces: new Set<string>(),
    membersFail: new Set<string>()
  };

  for (const [roleId, role] of roles)
    if (role.managed || !role.editable) {
      res.noPermissions.push(role);
      roles.delete(roleId);
    }

  if (!roles.size && (res.noPermissions.length || res.hasEveryone))
    return await msg.edit({
      content: `${t("role.remove.no_permissions_all", { e, locale })}` + `${res.hasEveryone ? `\n${t("role.remove.you_cannot_remove_everyone", { e, locale })}` : ""}`
    });

  await msg.edit({ content: t("role.remove.removing", { e, locale }) });

  for await (const member of members.values())
    if (member?.roles instanceof GuildMemberRoleManager)
      await member.roles.remove(roles, `Roles removed by ${author.username}`)
        .then(m => {
          if (!m.roles.cache.hasAll(...Array.from(roles.keys())))
            res.membersSucces.add(m.id);
          else res.membersFail.add(m.id);
        })
        .catch(() => {
          res.membersSucces.delete(member.id);
          res.membersFail.add(member.id);
        });

  if (res.membersSucces.size > 1 && res.membersSucces.size === roles.size) {

    let content = `${t("role.remove.all_ok", { e, locale })}\n`;


    if (res.noPermissions.length)
      content += `${t("role.remove.some_no_permissions", {
        e,
        locale,
        roles: res.noPermissions.join(", ")
      })}`;


    return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
  }

  if (members.size > 1) {

    let content = "";

    if (res.membersSucces.size)
      content += `${t("role.remove.recieves", { e, locale, members: res.membersSucces.size })}\n`;

    if (res.membersFail.size)
      content += `${t("role.remove.no_recieves", { e, locale, members: res.membersSucces.size })}\n`;

    if (res.noPermissions.length)
      content += `${t("role.remove.some_no_permissions", {
        e,
        locale,
        roles: res.noPermissions.join(", ")
      })}\n`;

    if (!content)
      content = `${t("role.remove.no_response_data", { e, locale })}`;

    return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
  }

  let content = "";

  if (res.membersSucces.size === 1)
    content += `${t("role.remove.success", { e, locale, member: members.first(), role: roles.first() })}\n`;

  if (res.membersSucces.size > 1 && res.membersSucces.size === roles.size)
    content += `${t("role.remove.recieves_all", { e, locale, member: members.first() })}\n`;

  if (res.membersFail.size)
    content += `${t("role.remove.no_recieves_all", { e, locale, member: members.first() })}\n`;

  if (res.noPermissions.length)
    content += `${t("role.remove.some_no_permissions", {
      e,
      locale,
      roles: res.noPermissions.join(", ")
    })}`;

  if (!content)
    content = `${t("role.remove.no_response_data", { e, locale })}`;

  return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
}