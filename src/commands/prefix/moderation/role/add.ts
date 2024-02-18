import { GuildMemberRoleManager, Message, Role } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";

export default async function addRole(message: Message<true>) {

  const { userLocale: locale, author, guildId } = message;
  const members = await message.getMultipleMembers();
  const roles = message.getMultipleRoles();

  if (!roles.size)
    return await message.reply({ content: t("role.add.no_roles_mentioned", { e, locale }) });

  if (!members.length)
    return await message.reply({ content: t("role.add.no_members_mentioned", { e, locale }) });

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
    return await message.reply({
      content: `${t("role.add.no_permissions_all", { e, locale })}` + `${res.hasEveryone ? `\n${t("role.add.you_cannot_add_everyone", { e, locale })}` : ""}`
    });

  const msg = await message.reply({ content: t("role.add.adding", { e, locale }) });

  for await (const member of members)
    if (member?.roles instanceof GuildMemberRoleManager)
      await member!.roles.add(roles, `Roles added by ${author.username}`)
        .then(m => {
          if (m.roles.cache.hasAll(...Array.from(roles.keys())))
            res.membersSucces.add(m.id);
          else res.membersFail.add(m.id);
        })
        .catch(() => {
          res.membersSucces.delete(member.id);
          res.membersFail.add(member.id);
        });

  if (res.membersSucces.size === roles.size) {

    let content = `${t("role.add.all_ok", { e, locale })}\n`;


    if (res.noPermissions.length)
      content += `${t("role.add.some_no_permissions", {
        e,
        locale,
        roles: res.noPermissions.join(", ")
      })}`;


    return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
  }

  if (members.length > 1) {

    let content = "";

    if (res.membersSucces.size)
      content += `${t("role.add.recieves", { e, locale, members: res.membersSucces.size })}\n`;

    if (res.membersFail.size)
      content += `${t("role.add.no_recieves", { e, locale, members: res.membersSucces.size })}\n`;

    if (res.noPermissions.length)
      content += `${t("role.add.some_no_permissions", {
        e,
        locale,
        roles: res.noPermissions.join(", ")
      })}\n`;

    if (!content)
      content = `${t("role.add.no_response_data", { e, locale })}`;

    return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
  }

  let content = "";

  if (res.membersSucces.size === 1)
    content += `${t("role.add.success", { e, locale, member: members[0], role: roles.first() })}\n`;

  if (res.membersSucces.size > 1 && res.membersSucces.size === roles.size)
    content += `${t("role.add.recieves_all", { e, locale, member: members[0] })}\n`;

  if (res.membersFail.size)
    content += `${t("role.add.no_recieves_all", { e, locale, member: members[0] })}\n`;

  if (res.noPermissions.length)
    content += `${t("role.add.some_no_permissions", {
      e,
      locale,
      roles: res.noPermissions.join(", ")
    })}`;

  if (!content)
    content = `${t("role.add.no_response_data", { e, locale })}`;

  return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
}