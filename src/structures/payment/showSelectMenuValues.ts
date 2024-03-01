import { ButtonInteraction } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";

export default async function showSelectMenuValues(interaction: ButtonInteraction<"cached">) {

  const { userLocale: locale, user } = interaction;
  const options = [{
    label: "R$ 1.00",
    description: "+1.000 Safiras & +2.000 XP",
    value: "1"
  }] as { label: string, description: string, value: string }[];

  for (let i = 1; i < 24; i++) {
    let value = i * 5;
    value *= 0.99;
    options.push({
      label: `R$ ${value.toFixed(2)}`,
      description: `+${((value * value) * 1000).currency()} Safiras & +${((value * value) * 3000).currency()} XP`,
      value: `${value}`
    });
  }

  const selectMenu = {
    type: 1,
    components: [{
      type: 3,
      custom_id: JSON.stringify({ c: "mpg", src: "values", id: user.id }),
      placeholder: t("mercadopago.select_menu_placeholder", locale),
      options
    }]
  };

  return await interaction.update({
    content: t("mercadopago.choose_your_price", { e, locale }),
    components: [selectMenu]
  });
}