import { ButtonInteraction, MessageFlags } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";

export default async function copy(interaction: ButtonInteraction<"cached">) {

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const { user, userLocale: locale, message } = interaction;

  const payment = await Database.Payments.findOne({ "metadata.user_id": user.id });

  if (!payment) {
    const content = t("mercadopago.payment_not_found", { e, locale });
    await message.edit({ content, embeds: [], components: [] });
    return await interaction.editReply({ content });
  }

  return await interaction.editReply({
    content: payment.point_of_interaction?.transaction_data?.qr_code || "???",
  });
}