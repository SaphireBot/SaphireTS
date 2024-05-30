import { ButtonStyle, LocaleString } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export function buttonsTeams(locale: LocaleString, userId: string, disabled: boolean) {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: t("teams.components.buttons.join", locale),
          emoji: e.amongusdance.emoji(),
          custom_id: JSON.stringify({ c: "teams", src: "join" }),
          style: ButtonStyle.Primary
        },
        {
          type: 2,
          label: t("teams.components.buttons.leave", locale),
          emoji: e.Leave.emoji(),
          custom_id: JSON.stringify({ c: "teams", src: "leave" }),
          style: ButtonStyle.Danger
        },
        {
          type: 2,
          label: t("teams.components.buttons.giveaway", locale),
          emoji: e.ModShield.emoji(),
          custom_id: JSON.stringify({ c: "teams", src: "giveaway", id: userId }),
          style: ButtonStyle.Success,
          disabled
        },
        {
          type: 2,
          label: t("teams.components.buttons.cancel", locale),
          emoji: e.ModShield.emoji(),
          custom_id: JSON.stringify({ c: "teams", src: "cancel", id: userId }),
          style: ButtonStyle.Secondary
        },
      ]
    }
  ];
}