import { ButtonInteraction, ButtonStyle, Colors, ComponentType, ContainerBuilder, MessageFlags, parseEmoji, SectionBuilder, TextDisplayBuilder } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import { urls } from "../../../util/constants";

export default async function viewQrCode(interaction: ButtonInteraction) {

  const { userLocale: locale, user } = interaction;
  const data = await Database.Users.findOne({ id: user.id });
  const codes = data?.QrCode || [];
  const container = new ContainerBuilder({ accent_color: Colors.Blue });

  if (!codes.length)
    return await interaction.reply({
      content: t("qrcode.no_qr", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const sections: SectionBuilder[] = [];

  for (let i = 0; i < codes.length; i++)
    sections.push(
      new SectionBuilder({
        components: [
          {
            content: `[${codes[i].name}](${urls.createQrCode}${encodeURI(codes[i].content)})`,
            type: ComponentType.TextDisplay,
          },
        ],
        accessory: {
          custom_id: JSON.stringify({ c: "qr", src: "delete", name: codes[i].name }),
          emoji: parseEmoji(e.Trash)! || "🗑️",
          style: ButtonStyle.Danger,
          type: ComponentType.Button,
        },
      }),
    );

  container.addTextDisplayComponents(
    new TextDisplayBuilder({
      content: t("qrcode.viewer", locale),
    }),
  ).addSectionComponents(sections);

  await interaction.message.delete().catch(() => { });
  await sleep(1500);
  return await interaction.reply({
    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    components: [container],
  });
}