import { ChatInputCommandInteraction, Collection, GuildMemberRoleManager, Message, Role, GuildMember } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function remove(
  interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
  args?: string[],
) {

  const { guild, userLocale: locale, guildId, member } = interactionOrMessage;
  const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

  const queries = (
    interactionOrMessage instanceof ChatInputCommandInteraction
      ? [
        interactionOrMessage.options.getString("members")!.match(/[\w\d]+/g)?.map(str => str?.toLowerCase()),
        interactionOrMessage.options.getString("roles")!.match(/[\w\d]+/g)?.map(str => str?.toLowerCase()),
      ].flat()
      : args!.slice(1).join(" ").match(/[\w\d]+/g)!.map(str => str?.toLowerCase())
  ).filter(Boolean);

  let msg: Message<boolean> | undefined | null;

  if (interactionOrMessage instanceof ChatInputCommandInteraction)
    msg = await interactionOrMessage.reply({
      content: t("role.remove.loading", { e, locale }),
      withResponse: true,
    }).then(res => res.resource?.message);

  if (interactionOrMessage instanceof Message)
    msg = await interactionOrMessage.reply({
      content: t("role.remove.loading", { e, locale }),
    });

  if (!msg?.id) return;

  const members = interactionOrMessage instanceof ChatInputCommandInteraction
    ? new Collection<string, GuildMember>()
    : await interactionOrMessage.parseMemberMentions();

  const roles = interactionOrMessage instanceof ChatInputCommandInteraction
    ? new Collection<string, Role>()
    : await interactionOrMessage.parseRoleMentions();

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
    return await msg.edit({ content: t("role.remove.nothing_found", { e, locale }) }).catch(() => { });

  const res = {
    noPermissions: [] as Role[],
    hasEveryone: roles.delete(guildId),
    membersSuccess: new Set<string>(),
    membersFail: new Set<string>(),
    higherThanHighest: new Map(),
  };

  for (const [roleId, role] of roles) {

    if (
      (role.position >= (member?.roles.highest.position || 0))
      && guild.ownerId !== member!.id
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
      content: `${t("role.remove.no_permissions_all", { e, locale })}` + `${res.hasEveryone ? `\n${t("role.remove.you_cannot_remove_everyone", { e, locale })}` : ""}`,
    }).catch(() => { });

  for await (const member of members.values())
    if (member?.roles instanceof GuildMemberRoleManager)
      await member.roles.remove(roles, `Roles removed by ${user.username}`)
        .then(m => {
          if (!m.roles.cache.hasAll(...Array.from(roles.keys())))
            res.membersSuccess.add(m.id);
          else res.membersFail.add(m.id);
        })
        .catch(() => {
          res.membersSuccess.delete(member.id);
          res.membersFail.add(member.id);
        });

  if (res.membersSuccess.size > 1 && res.membersSuccess.size === roles.size) {

    let content = `${t("role.remove.all_ok", { e, locale })}\n`;

    if (res.higherThanHighest.size)
      content += `${t("role.highest", {
        e,
        locale,
        roles: Array.from(res.higherThanHighest.values()).join(", "),
      })}\n`;

    if (res.noPermissions.length)
      content += `${t("role.remove.some_no_permissions", {
        e,
        locale,
        roles: res.noPermissions.join(", "),
      })}`;

    return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
  }

  if (members.size > 1) {

    let content = "";

    if (res.membersSuccess.size)
      content += `${t("role.remove.recieves", { e, locale, members: res.membersSuccess.size })}\n`;

    if (res.higherThanHighest.size)
      content += `${t("role.highest", {
        e,
        locale,
        roles: Array.from(res.higherThanHighest.values()).join(", "),
      })}\n`;

    if (res.membersFail.size)
      content += `${t("role.remove.no_recieves", { e, locale, members: res.membersSuccess.size })}\n`;

    if (res.noPermissions.length)
      content += `${t("role.remove.some_no_permissions", {
        e,
        locale,
        roles: res.noPermissions.join(", "),
      })}\n`;

    if (!content)
      content = `${t("role.remove.no_response_data", { e, locale })}`;

    return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
  }

  let content = "";

  if (res.membersSuccess.size === 1)
    content += `${t("role.remove.success", { e, locale, member: members.first(), role: roles.first() })}\n`;

  if (res.higherThanHighest.size)
    content += `${t("role.highest", {
      e,
      locale,
      roles: Array.from(res.higherThanHighest.values()).join(", "),
    })}\n`;

  if (res.membersSuccess.size > 1 && res.membersSuccess.size === roles.size)
    content += `${t("role.remove.recieves_all", { e, locale, member: members.first() })}\n`;

  if (res.membersFail.size)
    content += `${t("role.remove.no_recieves_all", { e, locale, member: members.first() })}\n`;

  if (res.noPermissions.length)
    content += `${t("role.remove.some_no_permissions", {
      e,
      locale,
      roles: res.noPermissions.join(", "),
    })}`;

  if (!content)
    content = `${t("role.remove.no_response_data", { e, locale })}`;

  return await msg.edit({ content: content.limit("MessageContent") }).catch(() => { });
}