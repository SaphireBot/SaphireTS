import { ButtonStyle, StringSelectMenuInteraction } from "discord.js";
import { MercadoPagoPaymentSchemaType } from "../../database/schemas/mercadopago";
import { t } from "../../translator";
import { e } from "../../util/json";

export default async function paymentOpened(interaction: StringSelectMenuInteraction<"cached">, data: MercadoPagoPaymentSchemaType) {
  const { userLocale: locale } = interaction;
  const { channel_id, guild_id, message_id, user_id } = data.metadata!;
  const link = `https://discord.com/channels/${guild_id}/${channel_id}/${message_id}`;

  return await interaction.editReply({
    content: t("mercadopago.paymentOpened", {
      e,
      locale,
      link
    }),
    components: [{
      type: 1,
      components: [
        {
          type: 2,
          label: t("mercadopago.components.cancel", locale),
          emoji: e.Trash.emoji(),
          custom_id: JSON.stringify({ c: "mpg", src: "delete", id: user_id }),
          style: ButtonStyle.Danger
        },
        {
          type: 2,
          label: t("mercadopago.components.jump", locale),
          emoji: "🔗".emoji(),
          url: link,
          style: ButtonStyle.Link
        }
      ]
    }]
  });
}