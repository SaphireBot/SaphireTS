import { MessageFlags, StringSelectMenuInteraction } from "discord.js";
import { GlobalStaffManager } from "../../../../managers";
import { getStaffInitialComponents, getStaffInitialEmbed } from "../button.redirect";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Modals from "../../../../structures/modals";

export default async function showRebootModals(
  interaction: StringSelectMenuInteraction<"cached">,
) {

  const { userLocale: locale, user } = interaction;

  if (!GlobalStaffManager.isAdmin(user.id)) {
    await interaction.update({
      embeds: getStaffInitialEmbed(locale, "dev", user.toString()),
      components: getStaffInitialComponents(locale, "dev", user.id),
    });
    await sleep(1500);
    return await interaction.followUp({
      flags: MessageFlags.Ephemeral,
      content: t("staff.perms.dev", { e, locale }),
    });
  }
  
  return await interaction.showModal(
    Modals.rebootModalReason(locale, user.id),
  );
}