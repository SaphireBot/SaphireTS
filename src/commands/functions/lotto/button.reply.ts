import { ButtonInteraction, MessageFlags } from "discord.js";
import Database from "../../../database";
import { LottoManager } from "../../../managers";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import lottoPainel from "./painel.container";
import modals from "../../../structures/modals";
import checkNumber from "./button.my_number";
import notifyLotto from "./button.reminder";

export default async function lottoButtonBet(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "lotto", src: "play" | "check" | "reminder", uid: string },
) {

  const { userLocale: locale, user } = interaction;

  if (user.id !== customData?.uid)
    return await interaction.reply({
      flags: [MessageFlags.Ephemeral],
      content: t("tempcall.you_cannot_click_here", { e, locale }),
    });

  if (customData.src === "check")
    return await checkNumber(interaction, customData);

  if (customData.src === "reminder")
    return await notifyLotto(interaction);

  if (LottoManager.userInBet(user.id)) {

    await lottoPainel(interaction);

    return await interaction.followUp({
      content: t("lotto.no_balance", { e, locale, value: LottoManager.baseValue }),
      flags: [MessageFlags.Ephemeral],
    });

  }

  const balance = await Database.getBalance(user.id);

  if (balance < LottoManager.baseValue)
    return await interaction.reply({
      content: t("lotto.no_balance", { e, locale, value: LottoManager.baseValue }),
      flags: [MessageFlags.Ephemeral],
    });

  return await interaction.showModal(
    modals.chooseLottoNumber(locale, user.id),
  );

}