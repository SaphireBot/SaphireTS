import { StringSelectMenuInteraction } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import paymentOpened from "./paymentOpened";
import { MercadoPagoPaymentSchemaType } from "../../database/schemas/mercadopago";
import created from "./created";
import { getAccessToken } from ".";

export default async function generateQRCode(interaction: StringSelectMenuInteraction<"cached">) {

  const { values, userLocale: locale, guildId, user, channelId } = interaction;
  const value = values[0] || "0";
  const amount = parseInt(Number(value).toFixed(2));

  if (amount <= 0)
    return await interaction.update({
      content: t("mercadopago.invalid_amount", { e, locale }),
      components: []
    });

  const msg = await interaction.update({
    content: t("mercadopago.generating", { e, locale }),
    components: [],
    fetchReply: true
  });

  if (!msg?.id)
    return await interaction.editReply({
      content: "NO_MESSAGE_PARAMS_EXISTS++#15325#"
    });

  return await fetch(
    "https://api.saphire.one/payments",
    {
      method: "POST",
      headers: {
        authorization: getAccessToken(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        guild_id: guildId,
        user_id: user.id,
        channel_id: channelId,
        message_id: msg.id,
        username: user.username,
        email: "anyemail@gmail.com",
        amount
      })
    }
  )
    .then(async res => {
      const { status } = res;
      const data = (await res.json()) as { message: string, error?: string, data: MercadoPagoPaymentSchemaType };

      if (status === 201 && "data" in data)
        return await created(interaction, data.data);

      if (status === 406 && "data" in data)
        return await paymentOpened(interaction, data.data);

      if ([400, 429, 500].includes(status) && "message" in data)
        return await interaction.editReply({
          content: t("mercadopago.error", { e, locale, message: data.error || data.message })
        });

      console.log(res.status, data);
      return await interaction.editReply({
        content: t("mercadopago.unknown_response", { e, locale })
      });

    })
    .catch(async err => {
      console.log(err);
      return await interaction.editReply({
        content: t("mercadopago.error", { e, locale, message: err })
      });
    });

}