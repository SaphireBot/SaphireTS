import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import displayVideoList from "../../functions/youtube/displayVideoList";
import { YouTubeSearchResponse } from "../../../@types/youtube";
import { t } from "../../../translator";
import { getRandomAPIKey, YouTubeAPIKeys } from "../../functions/youtube/randomKey.youtube";

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
    name: "youtube",
    // name_localizations: getLocalizations("youtube.name"),
    description: "Search content in youtube",
    description_localizations: getLocalizations("youtube.description"),
    default_member_permissions: undefined,
    dm_permission: false,
    nsfw: false,
    options: [
      {
        name: "search",
        name_localizations: getLocalizations("youtube.options.0.name"),
        description: "What are you looking for?",
        description_localizations: getLocalizations("youtube.options.0.description"),
        type: ApplicationCommandOptionType.String,
        required: true
      },
      {
        name: "filter",
        name_localizations: getLocalizations("youtube.options.1.name"),
        description: "Choose one type",
        description_localizations: getLocalizations("youtube.options.1.description"),
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Channels",
            name_localizations: getLocalizations("youtube.options.1.choices.0"),
            value: "&type=channel"
          },
          {
            name: "Videos",
            name_localizations: getLocalizations("youtube.options.1.choices.1"),
            value: "&type=video"
          },
          {
            name: "Playlists",
            name_localizations: getLocalizations("youtube.options.1.choices.2"),
            value: "&type=playlist"
          },
          {
            name: "Channels and Videos",
            name_localizations: getLocalizations("youtube.options.1.choices.3"),
            value: "&type=channel&type=video"
          },
          {
            name: "Videos and Playlists",
            name_localizations: getLocalizations("youtube.options.1.choices.4"),
            value: "&type=video&type=playlist"
          },
          {
            name: "Playlist and Channels",
            name_localizations: getLocalizations("youtube.options.1.choices.5"),
            value: "&type=playlist&type=channel"
          },
        ]
      },
    ]
  },
  additional: {
    category: "util",
    admin: false,
    staff: false,
    api_data: {
      name: "youtube",
      description: "Pesquise no YouTube diretamente do seu servidor",
      category: "Utilidades",
      synonyms: [],
      tags: ["new"],
      perms: {
        user: [],
        bot: []
      }
    },
    async execute(interaction: ChatInputCommandInteraction) {

      const { options, userLocale: locale } = interaction;
      const query = encodeURI(options.getString("search", true));
      const type = options.getString("filter") || "";
      const key = getRandomAPIKey();

      if (!key)
        return await interaction.reply({
          content: t("youtube.no_params", { e, locale })
        });

      await interaction.reply({
        content: t("youtube.searching", { e, locale })
      });

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${key}&q=${query}${type}&part=snippet&maxResults=50&safeSearch=none`,
        { method: "GET" }
      )
        .then(res => res.json())
        .catch(err => {
          console.log("YouTube Fetch Error", err);
          return [{ error: { code: 403 }, items: [] }];
        }) as YouTubeSearchResponse;

      if (response?.error?.code === 403) {
        YouTubeAPIKeys.delete(key);
        setTimeout(() => YouTubeAPIKeys.add(key), (1000 * 60) * 60 * 12);
      }

      return await displayVideoList(interaction, response?.items || [], response.pageInfo?.totalResults || 0);

    }
  }
};