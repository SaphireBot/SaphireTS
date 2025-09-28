import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { GlobalSystemNotificationManager } from "../../../managers";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import Database from "../../../database";
import { getLocalizations } from "../../../util/getlocalizations";

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
    name: "say",
    // name_localizations: getLocalizations("COMMANDNAME.FIELD"),
    description: "Say something like another person",
    description_localizations: getLocalizations("say.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    // This is to enable DM Global commands
    // integration_types: [0, 1],
    // contexts: [0, 1, 2],
    options: [
      {
        name: "text",
        name_localizations: getLocalizations("say.options.0.name"),
        description: "Text to send",
        description_localizations: getLocalizations("say.options.0.description"),
        type: ApplicationCommandOptionType.String,
        autocomplete: false,
        required: true,
      },
      {
        name: "user",
        name_localizations: getLocalizations("say.options.1.name"),
        description: "User to copy",
        description_localizations: getLocalizations("say.options.1.description"),
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },
  additional: {
    category: "Diversão",
    admin: false,
    staff: false,
    api_data: {
      name: "say",
      description: "Diga algo como se fosse outra pessoa",
      category: "fun",
      synonyms: [],
      tags: [],
      perms: {
        user: [],
        bot: [],
      },
    },
    async execute(interaction: ChatInputCommandInteraction<"cached">) {

      const { options, channel, guild, userLocale: locale, member: Member, user: userInteraction } = interaction;
      const user = options.getUser("user")!;
      const text = options.getString("text")!;
      const member = await guild?.members.fetch(user.id).catch(() => null);

      if (!channel?.isSendable() || !member)
        return await interaction.reply({
          flags: [MessageFlags.Ephemeral],
          content: t("say.channel_unavailable", { e, locale }),
        });

      if (!guild.members.me?.permissions.has([PermissionFlagsBits.ManageWebhooks], true))
        return await permissionsMissing(interaction, [DiscordPermissons.ManageWebhooks], "Discord_client_need_some_permissions");

      const data = await Database.getGuild(guild.id);
      const commandEnable = data?.SayCommand || false;

      if (!commandEnable)
        return await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: Member.isAdministrator()
            ? t("say.command_disable_admin", { e, locale })
            : t("say.command_disable", { e, locale }),
        });

      const webhook = await GlobalSystemNotificationManager.fetchWebhook(
        channel,
        true,
        { reason: `${client.user!.username}'s Experience` },
      );

      if (!webhook)
        return await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: t("say.fail", { e, locale }),
        });

      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
      const avatarURL = member?.displayAvatarURL() || user.displayAvatarURL();

      const payload = {
        content: `${text.slice(0, 900)}\n \n-# ${userInteraction.username} ${userInteraction.id}`,
        avatarURL,
        username: member?.displayName || user.displayName,
      };


      return await GlobalSystemNotificationManager.sendMessage(payload, channel, webhook)
        .then(async res => {

          if (res === null) {
            const wh = await GlobalSystemNotificationManager.createWebhook(
              channel,
              {
                avatar: payload.avatarURL,
                name: payload.username,
                reason: `${client.user!.username}'s Experience`,
              },
            );

            if (wh)
              await GlobalSystemNotificationManager.sendMessage(payload, channel, wh);
          }

          return await interaction.deleteReply().catch(() => { });
        })
        .catch(async err => {
          console.log("FAIL", err);
          return await interaction.editReply({
            content: `${err}`,
          }).catch(() => { });
        });

    },
  },
};