import { ButtonInteraction, MessageFlags, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import { showSelectMenuValues, generateQRCode, cancelled, deletePayment, copy } from "./";

export default async function validateMercadoPagoIDButtons(interaction: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached">, data: { c: "mpg", src: string }) {

  if (!data?.src)
    return await interaction.update({
      content: t("mercadopago.no_customid", { e, locale: interaction.userLocale }),
      components: [],
    });

  const userId = JSON.parse(interaction.customId)?.id as string;

  if (userId !== interaction.user.id)
    return await interaction.reply({
      content: t("mercadopago.you_cannot_click_here", { e, locale: interaction.userLocale }),
      flags: [MessageFlags.Ephemeral],
    });

  if (interaction instanceof StringSelectMenuInteraction) {
    const value = interaction.values[0];
    if (Number(value) > 0) return await generateQRCode(interaction);
  }

  if (interaction instanceof ButtonInteraction) {
    if (data.src === "cancel") return await cancelled(interaction);
    if (data.src === "generate_key") return await showSelectMenuValues(interaction);
    if (data.src === "delete") return await deletePayment(interaction);
    if (data.src === "copy") return await copy(interaction);
    if (data.src === "retry") return await showSelectMenuValues(interaction);
  }

  return await interaction.update({
    content: "FUNCTION_NOT_FOUND#154365",
    components: [],
  });
}