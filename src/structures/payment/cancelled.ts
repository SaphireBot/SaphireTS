import { ButtonInteraction } from "discord.js";
import { e } from "../../util/json";
import { t } from "../../translator";

export default async function cancelled(interaction: ButtonInteraction<"cached">) {

  const data = {
    content: t("mercadopago.payment_cancelled", { e, locale: interaction.userLocale }),
    components: []
  };

  return interaction.replied
    ? await interaction.editReply(data)
    : await interaction.update(data);
}