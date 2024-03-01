import { ButtonInteraction } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import { cancelled, getAccessToken } from ".";

export default async function cancel(interaction: ButtonInteraction<"cached">) {

  const { userLocale: locale, user } = interaction;

  await interaction.update({
    content: t("mercadopago.cancelling", { e, locale }),
    components: []
  });

  const response = await fetch(
    "https://api.saphire.one/payments",
    {
      method: "DELETE",
      headers: {
        authorization: getAccessToken(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user_id: user.id })
    }
  )
    .then(res => res.json())
    .catch(error => ({ message: "Error to call the API", error })) as { message: string, data?: any, error?: any };

  if ("message" in response && "data" in response)
    return await cancelled(interaction);

  return await interaction.editReply({
    content: t("mercadopago.error2", { e, locale, message: response.message, error: response.error || "No error" })
  });
}