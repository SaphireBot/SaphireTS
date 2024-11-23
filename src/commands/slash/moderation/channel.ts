import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import commandsLocker from "./channels/commands";

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
    name: "channel",
    name_localizations: getLocalizations("channel.name"),
    description: "Manage the server's channel easier",
    description_localizations: getLocalizations("channel.description"),
    default_member_permissions: PermissionFlagsBits.ManageChannels.toString(),
    dm_permission: false,
    nsfw: false,
    // This is to enable DM Global commands
    // integration_types: [0, 1],
    // contexts: [0, 1, 2],
    options: [
      {
        name: "commands",
        name_localizations: getLocalizations("channel.options.0.name"),
        description: "[moderation] Manage my commands in this channels",
        description_localizations: getLocalizations("channel.options.0.description"),
        type: 1,
        options: [
          {
            name: "lock",
            name_localizations: getLocalizations("channel.options.0.options.0.name"),
            description: "Lock my commands in this channel",
            description_localizations: getLocalizations("channel.options.0.options.0.description"),
            type: ApplicationCommandOptionType.Channel,
            channel_types: [
              ChannelType.GuildAnnouncement,
              ChannelType.GuildText,
            ],
          },
          {
            name: "unlock",
            name_localizations: getLocalizations("channel.options.0.options.1.name"),
            description: "Unlock my commands in this channel",
            description_localizations: getLocalizations("channel.options.0.options.1.description"),
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
          },
        ],
      },
    ],
  },
  additional: {
    category: "moderation",
    admin: false,
    staff: false,
    api_data: {
      name: "canal",
      description: "Gerencie os canais de um jeito mais fácil",
      category: "Moderação",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("channel.name") || {},
          ),
        ),
      ),
      tags: [],
      perms: {
        user: [DiscordPermissons.ManageChannels],
        bot: [DiscordPermissons.ManageChannels],
      },
    },
    async execute(interaction: ChatInputCommandInteraction<"cached">) {

      const { options } = interaction;
      const command = options.getSubcommand();

      if (command === "commands") return await commandsLocker(interaction);
    },
  },
};