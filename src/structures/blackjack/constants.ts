import { ButtonStyle, LocaleString } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
const deck = e.cards;

export function initialButtons(locale: LocaleString, players: number, max: number) {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: `${t("keyword_play", locale)} ${players}/${max}`,
          emoji: deck.random().emoji,
          custom_id: "join",
          style: ButtonStyle.Primary
        },
        {
          type: 2,
          label: t("keyword_exit", locale),
          emoji: e.Leave,
          custom_id: "leave",
          style: ButtonStyle.Danger
        },
        {
          type: 2,
          label: t("keyword_start", locale),
          emoji: "⭐",
          custom_id: "start",
          style: ButtonStyle.Success
        },
        {
          type: 2,
          label: t("keyword_cancel", locale),
          emoji: e.DenyX,
          custom_id: "cancel",
          style: ButtonStyle.Secondary
        }
      ]
    }
  ];
}

export function playButtons(locale: LocaleString, disabled: boolean) {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: `${t("blackjack.components.hit", locale)}`,
          emoji: "➕",
          custom_id: "hit",
          style: ButtonStyle.Primary,
          disabled: disabled || false
        },

        {
          type: 2,
          label: `${t("blackjack.components.stand", locale)}`,
          emoji: "🤚",
          custom_id: "stand",
          style: ButtonStyle.Primary,
          disabled: disabled || false
        }
      ]
    }
  ];
}