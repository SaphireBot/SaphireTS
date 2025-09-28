import {
  APIEmbed,
  APIEmbedField,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  MessageFlags,
  parseEmoji,
} from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { GlobalStaffManager } from "../../../managers";

type role = "owner" | "dev" | "admin" | "mod";

export default async function buttonInitialEmbedStaff(
  interaction: ButtonInteraction<"cached">,
  customData: {
    c: "staff",
    src: role,
    uid: string
  },
) {

  if (
    !customData
    || !customData?.src
    || !customData?.uid
  ) return;

  const { userLocale: locale, user } = interaction;

  if (user.id !== customData.uid)
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t("tempcall.you_cannot_click_here", { e, locale }),
    });

  return await interaction.update({
    embeds: getStaffInitialEmbed(locale, customData.src, user.toString()),
    components: getStaffInitialComponents(locale, customData.src, user.id),
  });

}

function getFields(role: role, locale: string): APIEmbedField[] {

  if (role === "owner")
    return [
      {
        name: `🖊️ [OWNER] ${t("staff.embed.fields.devs.name", locale)}`,
        value: t("staff.embed.fields.devs.value", locale),
      },
      {
        name: `🖊️ [OWNER] ${t("staff.embed.fields.admins.name", locale)}`,
        value: t("staff.embed.fields.admins.value", locale),
      },
    ];

  if (role === "dev")
    return [
      {
        name: `${e.Gear} [DEV] ${t("staff.embed.fields.reboot.name", locale)}`,
        value: t("staff.embed.fields.reboot.value", locale),
      },
      {
        name: `${e.Gear} [DEV] ${t("staff.embed.fields.register_slash.name", locale)}`,
        value: t("staff.embed.fields.register_slash.value", locale),
      },
      {
        name: `${e.Gear} [DEV] ${t("staff.embed.fields.linked_roles.name", locale)}`,
        value: t("staff.embed.fields.linked_roles.value", locale),
      },
      {
        name: `${e.Gear} [DEV] ${t("staff.embed.fields.gsn_notification.name", locale)}`,
        value: t("staff.embed.fields.gsn_notification.value", locale),
      }];

  if (role === "admin")
    return [
      {
        name: `${e.Admin} [ADMIN] ${t("staff.embed.fields.mods.name", locale)}`,
        value: t("staff.embed.fields.mods.value", locale),
      },
      {
        name: `${e.Admin} [ADMIN] ${t("staff.embed.fields.game_cache.name", locale)}`,
        value: t("staff.embed.fields.game_cache.value", locale),
      },
      {
        name: `${e.Admin} [ADMIN] ${t("staff.embed.fields.system_cache.name", locale)}`,
        value: t("staff.embed.fields.system_cache.value", locale),
      },
      {
        name: `${e.Admin} [ADMIN] ${t("staff.embed.fields.commands.name", locale)}`,
        value: t("staff.embed.fields.commands.value", locale),
      },
      {
        name: `${e.Admin} [ADMIN] ${t("staff.embed.fields.safiras.name", locale)}`,
        value: t("staff.embed.fields.safiras.value", locale),
      },
      {
        name: `${e.Admin} [ADMIN] ${t("staff.embed.fields.battleroyale.name", locale)}`,
        value: t("staff.embed.fields.battleroyale.value", locale),
      },
      ];

  if (role === "mod")
    return [
      {
        name: `${e.ModShield} [MOD] ${t("staff.embed.fields.blacklist.name", locale)}`,
        value: t("staff.embed.fields.blacklist.value", locale),
      },
      {
        name: `${e.ModShield} [MOD] ${t("staff.embed.fields.suspend.name", locale)}`,
        value: t("staff.embed.fields.suspend.value", locale),
      },
      {
        name: `${e.ModShield} [MOD] ${t("staff.embed.fields.warn.name", locale)}`,
        value: t("staff.embed.fields.warn.value", locale),
      }];

  return [];
}

export function getStaffInitialEmbed(locale: string, role: role, staff: string): APIEmbed[] {
  return [{
    color: Colors.Blue,
    title: t("staff.embed.initial.title", { e, locale, name: client.user!.username }),
    description: t("staff.embed.initial.description", { e, locale, staff }),
    fields: getFields(role, locale),
    footer: {
      text: `${client.user!.username}'s Staff System`,
      icon_url: client.user!.displayAvatarURL(),
    },
  }];
}

export function getStaffInitialComponents(locale: string, role: role, uid: string): any[] {

  const buttons = {
    type: 1,
    components: [
      {
        type: 2,
        label: t("staff.buttons.owner", { locale, staffs: 1 }),
        custom_id: JSON.stringify({ c: "staff", src: "owner", uid }),
        style: GlobalStaffManager.isOwner(uid) ? ButtonStyle.Primary : ButtonStyle.Secondary,
        emoji: parseEmoji("🖊️"),
      },
      {
        type: 2,
        label: t("staff.buttons.dev", { locale, staffs: GlobalStaffManager.developersIds.size }),
        custom_id: JSON.stringify({ c: "staff", src: "dev", uid }),
        style: GlobalStaffManager.isDev(uid) ? ButtonStyle.Primary : ButtonStyle.Secondary,
        emoji: parseEmoji(e.Animated.SaphirePanic),
      },
      {
        type: 2,
        label: t("staff.buttons.admin", { locale, staffs: GlobalStaffManager.administratorsIds.size }),
        custom_id: JSON.stringify({ c: "staff", src: "admin", uid }),
        style: GlobalStaffManager.isAdmin(uid) ? ButtonStyle.Primary : ButtonStyle.Secondary,
        emoji: parseEmoji(e.Admin),
      },
      {
        type: 2,
        label: t("staff.buttons.mod", { locale, staffs: GlobalStaffManager.moderatorsIds.size }),
        custom_id: JSON.stringify({ c: "staff", src: "mod", uid }),
        style: GlobalStaffManager.isMod(uid) ? ButtonStyle.Primary : ButtonStyle.Secondary,
        emoji: parseEmoji(e.ModShield),
      },
    ],
  };

  const disabled = {
    owner: GlobalStaffManager.isOwner.bind(GlobalStaffManager),
    dev: GlobalStaffManager.isDev.bind(GlobalStaffManager),
    admin: GlobalStaffManager.isAdmin.bind(GlobalStaffManager),
    mod: GlobalStaffManager.isMod.bind(GlobalStaffManager),
  }[role](uid);

  const selectMenu = {
    type: 1,
    components: [{
      type: 3,
      custom_id: JSON.stringify({ c: "staff", uid }),
      placeholder: t("staff.selectmenu.placeholder", locale),
      options: getSelectMenuOptions(role, locale, uid),
      disabled: !disabled,
    }],
  };

  return [
    buttons,
    selectMenu,
  ];
}

function getSelectMenuOptions(role: role, locale: string, uid: string) {

  if (role === "owner")
    return [
      {
        label: t("staff.embed.fields.devs.name", locale),
        emoji: parseEmoji("🖊️"),
        description: t("staff.embed.fields.devs.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "devs", uid }),
      },
      {
        label: t("staff.embed.fields.admins.name", locale),
        emoji: parseEmoji("🖊️"),
        description: t("staff.embed.fields.admins.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "admin", uid }),
      },
    ];

  if (role === "dev")
    return [
      {
        label: t("staff.embed.fields.reboot.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.reboot.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "reboot", uid }),
      },
      {
        label: t("staff.embed.fields.register_slash.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.register_slash.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "register_slash", uid }),
      },
      {
        label: t("staff.embed.fields.linked_roles.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.linked_roles.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "linked_roles", uid }),
      },
      {
        label: t("staff.embed.fields.gsn_notification.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.gsn_notification.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "gsn_notification", uid }),
      },
    ];

  if (role === "admin")
    return [
      {
        label: t("staff.embed.fields.mods.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.mods.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "mods", uid }),
      },
      {
        label: t("staff.embed.fields.game_cache.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.game_cache.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "game_cache", uid }),
      },
      {
        label: t("staff.embed.fields.system_cache.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.system_cache.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "system_cache", uid }),
      },
      {
        label: t("staff.embed.fields.commands.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.commands.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "commands", uid }),
      },
      {
        label: t("staff.embed.fields.safiras.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.safiras.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "safiras", uid }),
      },
      {
        label: t("staff.embed.fields.battleroyale.name", locale),
        emoji: parseEmoji(e.Animated.SaphirePanic),
        description: t("staff.embed.fields.battleroyale.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "battleroyale", uid }),
      },
    ];

  if (role === "mod")
    return [
      {
        label: t("staff.embed.fields.blacklist.name", locale),
        emoji: parseEmoji(e.ModShield),
        description: t("staff.embed.fields.blacklist.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "blacklist", uid }),
      },
      {
        label: t("staff.embed.fields.suspend.name", locale),
        emoji: parseEmoji(e.ModShield),
        description: t("staff.embed.fields.suspend.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "suspend", uid }),
      },
      {
        label: t("staff.embed.fields.warn.name", locale),
        emoji: parseEmoji(e.ModShield),
        description: t("staff.embed.fields.warn.value", locale).limit("SelectMenuOptionDescription"),
        value: JSON.stringify({ c: "staff", src: "warn", uid }),
      },
    ];

  return [];
}