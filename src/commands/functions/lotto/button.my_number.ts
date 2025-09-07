import { ButtonInteraction, MessageFlags } from "discord.js";
import { LottoManager } from "../../../managers";
import modals from "../../../structures/modals";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function checkNumber(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "lotto", src: "play" | "check" | "reminder", uid: string },
) {

  const { user, userLocale: locale } = interaction;

  const number = LottoManager.userNumber(user.id);

  if (!number && (user.id !== customData?.uid))
    return await interaction.reply({
      flags: [MessageFlags.Ephemeral],
      content: t("tempcall.you_cannot_click_here", { e, locale }),
    });

  if (!number)
    return await interaction.showModal(
      modals.chooseLottoNumber(locale, user.id),
    );

  return await interaction.reply({
    flags: [MessageFlags.Ephemeral],
    content: t("lotto.your_number", { e, number, locale }),
  });
}