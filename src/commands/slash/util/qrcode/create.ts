import { Colors, ContainerBuilder, MediaGalleryBuilder, MessageFlags, ModalSubmitInteraction, TextDisplayBuilder } from "discord.js";
import handler from "../../../../structures/commands/handler";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import Database from "../../../../database";

export default async function createQrCode(interaction: ModalSubmitInteraction) {

  const { userLocale: locale, fields, user } = interaction;
  const name = fields.getTextInputValue("name");
  const content = fields.getTextInputValue("content");
  const container = new ContainerBuilder({ accent_color: Colors.Blue });
  const title = new TextDisplayBuilder({ content: t("qrcode.created", { e, locale }) });

  const qrcode = new MediaGalleryBuilder({
    items: [
      {
        media: {
          url: `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURI(content)}`,
        },
      },
    ],
  });

  container
    .addTextDisplayComponents(title)
    .addMediaGalleryComponents(qrcode);

  await interaction.reply({
    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    components: [container],
  });

  await Database.Users.updateOne(
    { id: user.id },
    { $push: { "QrCode": { name, content } } },
    { upsert: true },
  );

  const command = handler.slashCommands.get("qrcode");
  if (command) await command.additional.execute(interaction as any);

  return;
}