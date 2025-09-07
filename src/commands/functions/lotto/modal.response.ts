import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { LottoManager } from "../../../managers";
import lottoPainel from "./painel.container";

export default async function respondeLottoModal(
  interaction: ModalSubmitInteraction<"cached">,
  _: { c: "lotto", uid: string },
) {

  const { userLocale: locale, user, fields } = interaction;
  const number = Number(fields.getTextInputValue("number"));

  if (isNaN(number) || number < 1 || number > 100)
    return await interaction.reply({
      flags: [MessageFlags.Ephemeral],
      content: t("lotto.invalid_number", { e, locale }),
    });

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const ok = await LottoManager.addUser(number, user.id);

  if (!ok)
    return await interaction.editReply({
      content: t("lotto.error_occured", { e, locale }),
    });

  await lottoPainel(interaction);

  return await interaction.editReply({
    content: t("lotto.success", {
      e,
      locale,
      value: LottoManager.baseValue,
      number,
    }),
  });

}