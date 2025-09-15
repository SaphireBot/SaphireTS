import { ButtonStyle, parseEmoji, User } from "discord.js";
import { e } from "../../util/json";
import { t } from "../../translator";

export function channelSendPayload(guildLocale: string) {
  return {
    content: t("chest.appeared", { e, locale: guildLocale }),
    components: buttons(false, guildLocale),
  };
};

export function chestCatchedPayload(user: User, locale: string, prize: { coins: number, exp: number }) {
  return {
    content: t("chest.user_catch", { e, locale, user, prize }),
    components: buttons(true, locale),
  };
}

export function chestFinalPayload(locale: string) {
  return {
    content: t("chest.recharged", { e, locale }),
    components: buttons(true, locale),
  };
}

function buttons(disabled: boolean, locale: string) {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: t("chest.catch", locale),
          emoji: parseEmoji(e.SaphireChest),
          custom_id: JSON.stringify({ c: "chest", src: "catch" }),
          style: ButtonStyle.Success,
          disabled,
        },
        {
          type: 2,
          label: t("chest.what_is_this", locale),
          custom_id: JSON.stringify({ c: "chest", src: "info" }),
          style: ButtonStyle.Primary,
        },
      ],
    },
  ];
}