export interface YouTubeSearchResponse {
  kind: "youtube#searchListResponse"
  etag: string
  nextPageToken: string
  prevPageToken: string
  regionCode: string
  pageInfo: {
    totalResults: string
    resultsPerPage: string
  }
  items: YouTubeVideoResponse[]
}

export interface YouTubeVideoResponse {
  kind: string
  etag: string
  id: VideoID
  snippet: Snippet
}

type VideoID = {
  kind: "youtube#video"
  videoId: string
};

// type ChannelID = {
//   kind: "youtube#channel"
//   channelId: string
// };

// type PlaylistID = {
//   kind: "youtube#playlist"
//   playlistId: string
// };

type Snippet = {
  publishedAt: string
  channelId: string
  title: string
  description: string
  thumbnails: YoutubeThumbnails
  channelTitle: string
  liveBroadcastContent: string
  publishTime: string
};

type YoutubeThumbnails = {
  default: ThumbanailParam
  medium: ThumbanailParam
  high: ThumbanailParam
};

type ThumbanailParam = {
  url: string
  width: number
  height: number
};