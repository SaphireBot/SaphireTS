import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { env } from "process";
import displayVideoList from "../../functions/youtube/displayVideoList";
import { YouTubeSearchResponse } from "../../../@types/youtube";
import { t } from "../../../translator";

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
    // name_localizations: getLocalizations("youtube.FIELD"),
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
            name: "Channelss",
            name_localizations: getLocalizations("youtube.options.1.choices.0"),
            value: "channel"
          },
          {
            name: "Videos",
            name_localizations: getLocalizations("youtube.options.1.choices.1"),
            value: "video"
          },
          {
            name: "Playlists",
            name_localizations: getLocalizations("youtube.options.1.choices.2"),
            value: "playlist"
          }
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
      const type = "video";  // options.getString("filter") || "video";

      await interaction.reply({
        content: t("youtube.searching", { e, locale })
      });

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${env.YOUTUBE_API_KEY}&q=${query}&type=${type}&part=snippet&maxResults=25&safeSearch=none`,
        { method: "GET" }
      )
        .then(res => res.json())
        .catch(err => {
          console.log("YouTube Fetch Error", err);
          return [{ items: [] }];
        }) as YouTubeSearchResponse;

      if (type === "video")
        return await displayVideoList(interaction, response?.items || []);

    }
  }
};