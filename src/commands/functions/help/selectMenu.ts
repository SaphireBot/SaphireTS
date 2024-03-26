import { t } from "../../../translator";
import { e } from "../../../util/json";

export default function selectMenu(locale: string, userId: string) {
  return {
    type: 1,
    components: [{
      type: 3,
      custom_id: JSON.stringify({ c: "help", uid: userId }),
      placeholder: t("help.selectmenu.placeholder", { e, locale }),
      options: [
        {
          label: t("help.selectmenu.options.0.label", { e, locale }),
          emoji: e.slash,
          description: t("help.selectmenu.options.0.description", { e, locale }),
          value: "slash"
        },
        {
          label: t("help.selectmenu.options.1.label", { e, locale }),
          emoji: "➖",
          description: t("help.selectmenu.options.1.description", { e, locale }),
          value: "prefix"
        },
        {
          label: t("help.selectmenu.options.2.label", { e, locale }),
          emoji: "🤖",
          description: t("help.selectmenu.options.2.description", { e, locale }),
          value: "apps"
        },
        {
          label: t("help.selectmenu.options.3.label", { e, locale }),
          emoji: e.Planet,
          description: t("help.selectmenu.options.3.description", { e, locale }),
          value: "global"
        },
        {
          label: t("help.selectmenu.options.4.label", { e, locale }),
          emoji: e.DenyX,
          description: t("help.selectmenu.options.4.description", { e, locale }),
          value: "cancel"
        }
      ]
    }]
  };
}