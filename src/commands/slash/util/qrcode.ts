import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  ModalSubmitInteraction,
  parseEmoji,
  SectionBuilder,
} from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
  data: {
    type: ApplicationCommandType.ChatInput,
    application_id: client.user?.id,
    guild_id: "",
    name: "qrcode",
    // name_localizations: getLocalizations("qrcode.name"),
    description: "Create a Qr Code",
    description_localizations: getLocalizations("qrcode.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    // This is to enable DM Global commands
    // integration_types: [0, 1],
    // contexts: [0, 1, 2],
    options: [
    ],
  },
  additional: {
    category: "util",
    admin: false,
    staff: false,
    api_data: {
      name: "qrcode",
      description: "Create a Qr Code",
      category: "Utilidades",
      synonyms: [],
      tags: [],
      perms: {
        user: [],
        bot: [],
      },
    },
    async execute(interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction, followUp?: boolean) {

      const { userLocale: locale, user } = interaction;
      const data = await Database.Users.findOne({ id: user.id });

      const container = new ContainerBuilder({
        accent_color: Colors.Blue,
      })
        .addSectionComponents(
          new SectionBuilder({
            components: [
              {
                content: t("qrcode.what_is_it", { locale, e }),
                type: ComponentType.TextDisplay,
              },
            ],
            accessory: {
              type: ComponentType.Thumbnail,
              media: {
                url: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://saphire.one",
              },
            },
          }),
        )
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>({
            components: [
              new ButtonBuilder({
                custom_id: JSON.stringify({ c: "qr", src: "create", uid: user.id }),
                emoji: parseEmoji(e.Reference)!,
                label: t("qrcode.create", { locale, codes: data?.QrCode?.length || 0 }),
                style: ButtonStyle.Success,
                disabled: (data?.QrCode?.length || 0) >= 10,
              }),
              new ButtonBuilder({
                custom_id: JSON.stringify({ c: "qr", src: "view", uid: user.id }),
                emoji: parseEmoji(e.Database)!,
                label: t("qrcode.my_qr", locale),
                style: ButtonStyle.Primary,
                disabled: (data?.QrCode?.length || 0) <= 0,
              }),
              new ButtonBuilder({
                custom_id: JSON.stringify({ c: "delete", uid: user.id }),
                emoji: parseEmoji(e.Trash)!,
                label: t("keyword_cancel", locale),
                style: ButtonStyle.Danger,
              }),
            ],
          }),
        );

      if (interaction instanceof ModalSubmitInteraction)
        return await interaction.message?.edit({
          flags: [MessageFlags.IsComponentsV2],
          components: [container],
        });

      if (followUp)
        return await interaction.followUp({
          flags: [MessageFlags.IsComponentsV2],
          components: [container],
        });

      if (
        interaction instanceof ButtonInteraction
        || interaction instanceof ChatInputCommandInteraction
      )
        return await interaction.reply({
          flags: [MessageFlags.IsComponentsV2],
          components: [container],
        });

    },
  },
};