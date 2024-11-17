import { parseEmoji } from "discord.js";
import { GuildSchemaType } from "../../database/schemas/guild";
import { t } from "../../translator";
import { e } from "../../util/json";

export default function lauchComponents(data: GuildSchemaType, userId: string, locale: string) {

  const active = data?.WelcomeNotification?.active || false;
  const hasData = (
    data?.WelcomeNotification?.body?.content?.length
    || data?.WelcomeNotification?.body?.embed
  ) ? true : false;

  return [
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: JSON.stringify({ c: "welcome", uid: userId, src: "lauch" }),
        placeholder: t("welcome.components.select_menu.lauch.placeholder", locale),
        options: [
          {
            label: t("welcome.components.select_menu.lauch.options.0.label", locale),
            emoji: parseEmoji(hasData ? "🔎" : e.DenyX)!,
            description: t(`welcome.components.select_menu.lauch.options.0.description_${hasData ? "on" : "off"}`, locale),
            value: "view",
          },
          {
            label: t("welcome.components.select_menu.lauch.options.1.label", locale),
            emoji: parseEmoji("💭")!,
            description: t(`welcome.components.select_menu.lauch.options.1.description_${hasData ? "on" : "off"}`, locale),
            value: "config_channel",
          },
          {
            label: t("welcome.components.select_menu.lauch.options.2.label", locale),
            emoji: parseEmoji("🖌️")!,
            description: t("welcome.components.select_menu.lauch.options.2.description", locale),
            value: "config",
          },
          {
            label: t(`welcome.components.select_menu.lauch.options.3.label_${active ? "on" : "off"}`, locale),
            emoji: parseEmoji(active ? "🔕" : e.Notification)!,
            description: t(`welcome.components.select_menu.lauch.options.3.description_${active ? "on" : "off"}`, locale),
            value: "active_switch",
          },
        ],
      }],
    },
  ];
}