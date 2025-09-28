import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { GlobalStaffManager } from "../../../../managers";
import { getStaffInitialComponents, getStaffInitialEmbed } from "../button.redirect";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";

export default async function initRebootMessage(
  interaction: ModalSubmitInteraction<"cached">,
  data: { c: "staff", src: "reboot", uid: string },
) {

  const { userLocale: locale, user, fields } = interaction;

  if (!GlobalStaffManager.isAdmin(data?.uid)) {
    await interaction.message?.edit({
      embeds: getStaffInitialEmbed(locale, "dev", user.toString()),
      components: getStaffInitialComponents(locale, "dev", user.id),
    });
    await sleep(1500);
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t("staff.perms.dev", { e, locale }),
    });
  }

  const reason = fields.getTextInputValue("reason") || "No reason given";

  await interaction.message?.delete()?.catch(() => { });
  await GlobalStaffManager.setRebootMessage(reason);
  return await interaction.reply({
    content: t("Saphire.rebooting.inicializing", { e, locale }),
  });
}
