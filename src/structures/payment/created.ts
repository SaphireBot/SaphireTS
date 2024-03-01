import { AttachmentBuilder, ButtonStyle, StringSelectMenuInteraction } from "discord.js";
import { MercadoPagoPaymentSchemaType } from "../../database/schemas/mercadopago";
import { e } from "../../util/json";

export default async function created(interaction: StringSelectMenuInteraction<"cached">, data: MercadoPagoPaymentSchemaType) {

  const pix = data!.point_of_interaction!.transaction_data;

  return await interaction.editReply({
    content: `${e.Loading} | Esperando resposta da API...`,
    embeds: [{
      image: { url: "attachment://qrcode.png" }
    }],
    files: [
      new AttachmentBuilder(
        Buffer.from(
          pix!.qr_code_base64!, "base64"
        ),
        { name: "qrcode.png" }
      )
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "PIX Copia e Cola",
            custom_id: JSON.stringify({ c: "mpg", src: "copy", id: interaction.user.id }),
            style: ButtonStyle.Secondary
          },
          {
            type: 2,
            label: "Pagar no Navegador",
            url: pix!.ticket_url!,
            style: ButtonStyle.Link
          }
        ]
      }
    ]
  });
}