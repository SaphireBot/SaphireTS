import { APIEmbedField, ButtonInteraction, ChatInputCommandInteraction, Collection, Colors, Message, StringSelectMenuInteraction } from "discord.js";
import { PlaylistID, YouTubeVideoResponse } from "../../../@types/youtube";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import buttonPagination from "./buttons.pagination";

const url = {
  video: (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`,
  channel: (channelId: string) => `https://www.youtube.com/channel/${channelId}`,
  playlist: (playlistId: string, title: string) => `[${title}](https://www.youtube.com/playlist?list=${playlistId})`,
};

export default async function displayVideoList(
  interaction: ChatInputCommandInteraction<"cached"> | Message<true>,
  msg: Message<true>,
  items: YouTubeVideoResponse[],
  totalResults: number
) {

  if (!Array.isArray(items)) items = [];

  const user = interaction instanceof ChatInputCommandInteraction
    ? interaction.user
    : interaction.author;

  const { userLocale: locale } = interaction;

  if (!items.length)
    return await msg.edit({
      content: t("youtube.no_response_items", { e, locale })
    });

  type video = { title: string, url: string, channelId: string };
  type channel = { channelTitle: string, url: string };
  const videos = new Collection<string, video[]>();
  const channels = new Collection<string, channel>();
  const playlistsFields = [] as APIEmbedField[];

  for (const item of items) {

    if (item.id.kind === "youtube#playlist") continue;

    const { channelId, channelTitle, title } = item.snippet;
    const video = videos.get(channelId) || [];
    const channel = channels.get(channelId) || {} as channel;

    if (item.id.kind === "youtube#video") {
      video.push({
        url: url.video(item.id.videoId),
        channelId,
        title
      });

      if (!channel.channelTitle)
        channel.channelTitle = channelTitle;

      if (!channel.url)
        channel.url = url.channel(channelId);
    }

    if (item.id.kind === "youtube#channel") {
      if (!channel.channelTitle)
        channel.channelTitle = channelTitle;

      if (!channel.url)
        channel.url = url.channel(channelId);
    }

    if (channel.url) channels.set(channelId, channel);
    if (video.length) videos.set(channelId, video);

  }

  const playlists = items.filter(item => item.id.kind === "youtube#playlist");
  if (playlists.length) {

    const fields = new Map<string, { name: string, value: string }>();

    for (const playlist of playlists) {

      const { channelId, channelTitle, title } = playlist.snippet;
      const link = `${url.playlist((playlist.id as PlaylistID).playlistId, title)}\n`;
      const data = fields.get(channelId);

      if (data) {
        data.value += link;
        fields.set(channelId, data);
      } else fields.set(channelId, { name: channelTitle, value: link });

    }

    playlistsFields.push(
      ...Array
        .from(fields.values())
        .map(d => ({
          name: d.name.limit("MessageEmbedFieldName"),
          value: d.value.limit("MessageEmbedFieldValue")
        }))
        .slice(0, 25)
    );

  }

  if (!videos.size && !channels.size && !playlistsFields.length)
    return await msg.edit({
      content: t("youtube.no_response_items", { e, locale })
    });

  const allVideos = Array
    .from(videos.values())
    .flat()
    .map(video => video.url);

  const allChannels = Array
    .from(channels.values())
    .flat()
    .map(channel => channel.url);

  const selectChannelMenu = {
    type: 1,
    components: [{
      type: 3,
      custom_id: "channels",
      placeholder: t("youtube.components.video.select_menu.channels_placeholder", { locale, allChannels }),
      options: channels
        .toJSON()
        .map((channel, index) => ({
          label: channel.channelTitle.limit("SelectMenuLabel"),
          emoji: e.youtube,
          value: `${index}`
        }))
        .slice(0, 25)
    }]
  };

  await msg.edit({
    content: allVideos[0] || allChannels[0] || null,
    embeds: (allVideos[0] || allChannels[0]) ? [] : [{ color: Colors.Blue, fields: playlistsFields }],
    components: components(0, videos.size)
  });

  const collector = msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    idle: (1000 * 60) * 15
  });

  let index = 0;
  let lastSelectInteraction: "videos" | "channels" = videos.size > 0 ? "videos" : "channels";
  collector.on("collect", async (int: ButtonInteraction | StringSelectMenuInteraction): Promise<any> => {

    if (int instanceof StringSelectMenuInteraction) {
      const customId = int.customId as "videos" | "channels";
      const value = int.values[0];
      lastSelectInteraction = customId;
      index = Number(value);
    }

    const display = lastSelectInteraction === "videos" ? allVideos : allChannels;

    if (int instanceof ButtonInteraction) {
      const customId = int.customId;
      if (customId === "zero") index = 0;
      if (customId === "preview") index = index > 0 ? index - 1 : display.length - 1;
      if (customId === "next") index = index >= (display.length - 1) ? 0 : index + 1;
      if (customId === "last") index = display.length - 1;
      if (customId === "playlist")
        return await int.reply({
          ephemeral: true,
          embeds: [{
            color: Colors.Blue,
            fields: playlistsFields
          }]
        });
    }

    return await int.update({
      content: display[index],
      embeds: display[index] ? [] : [{ color: Colors.Blue, fields: playlistsFields }],
      components: components(index, display.length)
    });
  });

  collector.on("end", async (): Promise<any> => await msg.edit({ components: [] }));

  function components(index: number, displayLength: number) {

    const comps: any[] = [];

    if (videos.size)
      comps.push(formatSelectVideoMenu());

    if (channels.size)
      comps.push(selectChannelMenu);

    if (videos.size || channels.size)
      comps.push(buttonPagination(index, displayLength, playlistsFields.length));

    return comps;
  }

  function formatSelectVideoMenu() {

    const options = videos
      .toJSON()
      .flat()
      .slice(0, 25)
      .map((video, index) => ({
        label: video.title.limit("SelectMenuLabel"),
        emoji: e.youtube,
        description: channels.get(video.channelId)!.channelTitle.limit("SelectMenuLabel"),
        value: `${index}`
      }));

    return {
      type: 1,
      components: [{
        type: 3,
        custom_id: "videos",
        placeholder: t("youtube.components.video.select_menu.video_placeholder", { options, totalResults: totalResults.currency(), locale }),
        options
      }]
    };
  }

  return;
}