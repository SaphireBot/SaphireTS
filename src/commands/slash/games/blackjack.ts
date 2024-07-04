import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { ChannelsInGame } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Blackjack from "../../../structures/blackjack/blackjack";
import Database from "../../../database";
import { BlackjackData } from "../../../@types/commands";

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
    name: "blackjack",
    // name_localizations: getLocalizations("blackjack.name"),
    description: "[game] Play blackjack with your friends",
    description_localizations: getLocalizations("blackjack.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "decks",
        name_localizations: getLocalizations("blackjack.options.0.name"),
        description: "How much decks this game will have?",
        description_localizations: getLocalizations("blackjack.options.0.description"),
        min_value: 2,
        max_value: 20
      },
      {
        name: "amount",
        name_localizations: getLocalizations("pay.options.1.name"),
        description: "How much Sapphires do you want to bet?",
        description_localizations: getLocalizations("glass.options.1.description"),
        min_value: 1,
        type: ApplicationCommandOptionType.Integer,
        autocomplete: true
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "language",
        name_localizations: getLocalizations("fastclick.options.0.name"),
        description: "Available languages",
        description_localizations: getLocalizations("fastclick.options.0.description"),
        autocomplete: true
      }
    ]
  },
  additional: {
    category: "games",
    admin: false,
    staff: false,
    api_data: {
      name: "blackjack",
      description: "Jogue blackjack com seus amigos",
      category: "Diversão",
      synonyms: Array.from(
        new Set(
          Object.values(
            getLocalizations("blackjack.name") || {}
          )
        )
      ),
      tags: [],
      perms: {
        user: [],
        bot: []
      }
    },
    async execute(interaction: ChatInputCommandInteraction<"cached">) {

      const { userLocale: locale, user, channelId, guildId } = interaction;

      if (ChannelsInGame.has(channelId))
        return await interaction.reply({
          content: t("glass.channel_in_use", { e, locale }),
          fetchReply: true
        })
          .then(msg => setTimeout(async () => await msg?.delete().catch(() => { }), 6000))
          .catch(() => { });

      const data = (await Database.Users.findOne({ id: user.id }))?.Blackjack as BlackjackData;
      if (data) {
        data.channelId = channelId;
        data.guildId = guildId;
        await Database.Games.set(`Blackjack.${user.id}`, data) as BlackjackData;
        await Database.Users.updateOne(
          { id: user.id },
          { $unset: { Blackjack: true } }
        );
        return new Blackjack(undefined, data);
      }

      return new Blackjack(interaction, {});
    }
  }
};