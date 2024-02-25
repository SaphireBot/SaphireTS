import { ChatInputCommandInteraction, Collection, GuildMember, GuildMemberRoleManager, Message, Role } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function addRole(
  interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
  args?: string[]
) {

  const { guild, userLocale: locale, guildId, member } = interactionOrMessage;
  const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

  const queries = (
    interactionOrMessage instanceof ChatInputCommandInteraction
      ? [
        interactionOrMessage.options.getString("members")!.match(/[\w\d]+/g)?.map(str => str?.toLowerCase()),
        interactionOrMessage.options.getString("roles")!.match(/[\w\d]+/g)?.map(str => str?.toLowerCase())
      ].flat()
      : args!.slice(1).join(" ").match(/[\w\d]+/g)!.map(str => str?.toLowerCase())
  ).filter(Boolean);

  const msg = await interactionOrMessage.reply({
    content: t("role.add.loading", { e, locale }),
    fetchReply: true
  });

  if (!msg?.id) return;

  const members = interactionOrMessage instanceof ChatInputCommandInteraction
    ? new Collection<string, GuildMember>()
    : await interactionOrMessage.parseMemberMentions();

  const roles = interactionOrMessage instanceof ChatInputCommandInteraction
    ? new Collection<string, Role>()
    : interactionOrMessage.parseRoleMentions();

  for await (const query of queries) {
    if (!query || members.has(query) || roles.has(query)) continue;

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

  if (!members.size || !roles.size)
    return await msg.edit({ content: t("role.add.nothing_found", { e, locale }) }).catch(() => { });

  const res = {
    noPermissions: [] as Role[],
    hasEveryone: roles.delete(guildId),
    membersSuccess: new Set<string>(),
    membersFail: new Set<string>(),
    higherThanHighest: new Map()
  };

  if (guild.ownerId !== member!.id)
    for (const [roleId, role] of roles) {
      if (
        member!.roles.highest.comparePositionTo(role) >= 0
      ) {
        res.higherThanHighest.set(role.id, role);
        roles.delete(role.id);
        continue;
      }

      if (role.managed || !role.editable) {
        res.noPermissions.push(role);
        roles.delete(roleId);
      }
    }

  if (!roles.size && (res.noPermissions.length || res.hasEveryone))
    return await msg.edit({
      content: `${t("role.add.no_permissions_all", { e, locale })}` + `${res.hasEveryone ? `\n${t("role.add.you_cannot_add_everyone", { e, locale })}` : ""}`
    }).catch(() => { });

  for await (const member of members.values())
    if (member?.roles instanceof GuildMemberRoleManager)
      await member!.roles.add(roles, `Roles added by ${user.username}`)
        .then(m => {
          if (m.roles.cache.hasAll(...Array.from(roles.keys())))
            res.membersSuccess.add(m.id);
          else res.membersFail.add(m.id);
        })
        .catch(() => {
          res.membersSuccess.delete(member.id);
          res.membersFail.add(member.id);
        });

  if (res.membersSuccess.size > 1 && res.membersSuccess.size === roles.size) {

    let content = `${t("role.add.all_ok", { e, locale })}\n`;

    if (res.higherThanHighest.size)
      content += `${t("role.highest", {
        e,
        locale,
        roles: Array.from(res.higherThanHighest.values()).join(", ")
      })}\n`;

    if (res.noPermissions.length)
      content += `${t("role.add.some_no_permissions", {
        e,
        locale,
        roles: res.noPermissions.join(", ")
      })}`;

    return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
  }

  if (members.size > 1) {

    let content = "";

    if (res.membersSuccess.size)
      content += `${t("role.add.recieves", { e, locale, members: res.membersSuccess.size })}\n`;

    if (res.higherThanHighest.size)
      content += `${t("role.highest", {
        e,
        locale,
        roles: Array.from(res.higherThanHighest.values()).join(", ")
      })}\n`;

    if (res.membersFail.size)
      content += `${t("role.add.no_recieves", { e, locale, members: res.membersSuccess.size })}\n`;

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

  if (res.membersSuccess.size === 1 && roles.size)
    content += `${t("role.add.success", { e, locale, member: members.first(), role: roles.first() })}\n`;

  if (res.higherThanHighest.size)
    content += `${t("role.highest", {
      e,
      locale,
      roles: Array.from(res.higherThanHighest.values()).join(", ")
    })}\n`;

  if (res.membersSuccess.size > 1 && res.membersSuccess.size === roles.size)
    content += `${t("role.add.recieves_all", { e, locale, member: members.first() })}\n`;

  if (res.membersFail.size)
    content += `${t("role.add.no_recieves_all", { e, locale, member: members.first() })}\n`;

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