import { ButtonInteraction, ButtonStyle, Colors, ComponentType, ContainerBuilder, MessageFlags, parseEmoji, SectionBuilder, TextDisplayBuilder } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { urls } from "../../../../util/constants";
import handler from "../../../../structures/commands/handler";

export default async function deleteQrCode(
  interaction: ButtonInteraction,
  customData: {
    c: "qr",
    uid: string,
    src?: "create" | "delete" | "view",
    name?: string
  },
) {

  const { userLocale: locale, user } = interaction;

  const data = await Database.Users.findOneAndUpdate(
    { id: user.id },
    { $pull: { QrCode: { name: customData?.name } } },
    { new: true, upsert: true },
  );

  const codes = data?.QrCode || [];

  if (!codes.length) {
    await interaction.update({
      flags: [MessageFlags.IsComponentsV2],
      components: [new TextDisplayBuilder({ content: t("qrcode.all_deleted", { e, locale }) })],
    });

    await sleep(2500);

    const cmd = handler.getSlashCommand("qrcode");
    if (cmd) return await cmd.additional.execute(interaction as any, true);
    return;
  }

  const container = new ContainerBuilder({ accent_color: Colors.Blue });
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
          emoji: parseEmoji(e.Trash)!,
          label: t("keyword_delete", locale),
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

  return await interaction.update({
    flags: [MessageFlags.IsComponentsV2],
    components: [container],
  });
}