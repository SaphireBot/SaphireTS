import { ButtonInteraction } from "discord.js";
import handler from "../../../structures/commands/handler";
import modals from "../../../structures/modals";
import viewQrCode from "./view";
import deleteQrCode from "./delete";

export default async function redirectQrCodeInteraction(
  interaction: ButtonInteraction<"cached">,
  customData: {
    c: "qr",
    uid: string,
    src?: "create" | "delete" | "view",
    name?: string
  },
) {

  const { user, userLocale: locale } = interaction;

  if (customData.src === "delete")
    return await deleteQrCode(interaction, customData);

  if (user.id !== customData.uid) {
    const cmd = handler.getSlashCommand("qrcode");
    if (cmd) return await cmd.additional.execute(interaction as any);
  }

  if (customData.src === "view")
    return await viewQrCode(interaction);

  if (customData.src === "create")
    return await interaction.showModal(modals.createQrCode(locale, user.id));

}