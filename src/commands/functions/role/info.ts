import { APIEmbed, ChatInputCommandInteraction, Collection, Colors, Message, PermissionsBitField, Role, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";

export default async function infoRole(
  interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>
) {

  const { guild, userLocale: locale } = interactionOrMessage;
  const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;
  const roles = interactionOrMessage instanceof Message
    ? interactionOrMessage.parseRoleMentions()
    : new Collection<string, Role>();

  if (interactionOrMessage instanceof ChatInputCommandInteraction) {
    const queries = interactionOrMessage.options.getString("roles", true).trim().split(/\s+/g);
    for (const query of queries) {
      const role = guild.roles.searchBy(query);
      if (role && !roles.has(role.id)) roles.set(role.id, role);
    }
  }

  if (!roles.size)
    return await interactionOrMessage.reply({
      content: t("role.info.not_roles_mentions", { e, locale }),
      ephemeral: true
    });

  const embeds = new Collection<string, APIEmbed>();
  const components = [{
    type: 1,
    components: [{
      type: 3,
      custom_id: "infoRolesSelectMenu",
      placeholder: t("role.info.select_menu_placeholder", locale),
      options: [] as any[]
    }]
  }];

  if (roles.size > 25) {
    let i = 0;
    for (const [roleId] of roles) {
      i++;
      if (i > 25)
        roles.delete(roleId);
    }
  }

  for (const role of roles.values()) {

    components[0].components[0].options.push({
      label: role.name,
      value: role.id,
    });

    embeds.set(role.id, {
      color: role.color || Colors.Blue,
      title: t("role.info.embed.title", { guild, locale }),
      fields: [
        {
          name: t("role.info.embed.fields.0.name", locale),
          value: t("role.info.embed.fields.0.value", {
            e,
            locale,
            role,
            hoist: t(`role.info.${role.hoist}`, locale),
            mentionable: t(`role.info.${role.mentionable}`, locale),
            managed: t(`role.info.${role.managed}`, locale),
          })
        },
        {
          name: t("role.info.embed.fields.1.name", locale),
          value: t("role.info.embed.fields.1.value", {
            locale,
            createdAt: Date.toDiscordCompleteTime(role.createdAt),
            timestamp: Date.stringDate(Date.now() - role.createdTimestamp, false, locale)
          })
        },
        {
          name: t("role.info.embed.fields.2.name", locale),
          value: t("role.info.embed.fields.2.value", {
            locale,
            role
          })
        },
        {
          name: t("role.info.embed.fields.3.name", { locale, e, client }),
          value: t("role.info.embed.fields.3.value", {
            locale,
            editable: t(`role.info.${role.editable ? "can_edit" : "cant_edit"}`, locale)
          })
        },
        {
          name: t("role.info.embed.fields.4.name", locale),
          value: t("role.info.embed.fields.4.value", {
            locale,
            permissions: role.permissions.has(PermissionsBitField.Flags.Administrator)
              ? `\`${t("Discord.Permissions.Administrator", locale)}\``
              : Object
                .entries(role.permissions.serialize()) // Serialize the permissions
                .filter(perm => perm[1]) // Filter the permissions enabled
                .map(([name]) => `\`${t(`Discord.Permissions.${name}`, locale)}\``) // Translate the permissions
                .join("\n") // Transform the array in a string
                .limit("EmbedFieldValue") // Limit the string length to avoid embed limit range error
              || t("role.info.no_permissions", locale)
          })
        },
        {
          name: t("role.info.embed.fields.5.name", locale),
          value: t("role.info.embed.fields.5.value", {
            locale,
            unicodeEmoji: role.unicodeEmoji &&
              `${t("role.info.tags.unicodeEmoji", { locale, role })}\n`,
            premiumSubscriberRole: role.tags?.premiumSubscriberRole &&
              `${t("role.info.tags.premiumSubscriberRole", { locale, e })}\n`,
            no_info: role.unicodeEmoji || role.tags?.premiumSubscriberRole
              ? ""
              : t("role.info.no_info", locale)
          })
        }
      ],
      footer: {
        text: t("role.info.embed.footer.text", { locale, role })
      }
    });
  }

  const msg = await interactionOrMessage.reply({
    embeds: [embeds.first()!],
    components: embeds.size > 1 ? components : []
  });

  if (embeds.size <= 1) return;

  return msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    idle: (1000 * 60) * 5
  })
    .on("collect", async (interaction: StringSelectMenuInteraction<"cached">): Promise<any> => {

      const roleId = interaction.values[0]!;
      const embed = embeds.get(roleId)!;

      return await interaction.update({ embeds: [embed] });
    })
    .on("end", async (): Promise<any> => await msg.edit({ components: [] }).catch(() => { }));

}