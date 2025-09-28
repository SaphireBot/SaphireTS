import { MessageFlags, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import showRebootModals from "./selectmenu/rebootModal";
import validatePhrases from "./battleroyale/phrases.validate";

type valueType = {
  c: "staff"
  src: "reboot"
  uid: string
}

export default async function selectStaffRedirect(
  interaction: StringSelectMenuInteraction<"cached">,
  customData: {
    c: "staff",
    uid: string
  },
) {

  if (
    !customData
    || !customData?.uid
  ) return;

  const { userLocale: locale, user } = interaction;

  if (user.id !== customData.uid)
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t("tempcall.you_cannot_click_here", { e, locale }),
    });

  const { values } = interaction;
  const value: valueType = JSON.parse(values?.[0] || "{}");

  if (!value || value?.uid !== user.id)
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t("tempcall.you_cannot_click_here", { e, locale }),
    });

  if (value.src === "reboot")
    return await showRebootModals(interaction);

  if (value.src === "battleroyale")
    return await validatePhrases(interaction, value as any);
}